import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral, ReferralStatus, ReferralPriority } from './entities/referral.entity';
import { ReferralDocument } from './entities/referral-document.entity';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { CreateReferralDocumentDto } from './dto/create-referral-document.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogService } from '../audit/audit-log.service';
import { ChatService } from '../chat/services/chat.service';
import { ChatGateway } from '../chat/websocket.gateway';
import { MulterFile } from '../types/express';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private referralsRepository: Repository<Referral>,
    @InjectRepository(ReferralDocument)
    private referralDocumentsRepository: Repository<ReferralDocument>,
    private supabaseService: SupabaseService,
    private auditLogService: AuditLogService,
    private chatService: ChatService,
    private chatGateway: ChatGateway,
    private notificationsService: NotificationsService,
  ) { }

  async create(createReferralDto: CreateReferralDto, userId: string): Promise<Referral> {
    const referral = this.referralsRepository.create({
      ...createReferralDto,
      referringProviderId: userId,
      status: ReferralStatus.PENDING,
    });

    const savedReferral = await this.referralsRepository.save(referral);

    // Create a chat room for the referral
    try {
      const chatRoomName = `Referral: ${createReferralDto.patientId.substring(0, 8)}`;
      const participants = [userId];
      if (createReferralDto.receivingProviderId) {
        participants.push(createReferralDto.receivingProviderId);
      }

      const { room } = await this.chatService.createChatRoom({
        name: chatRoomName,
        type: 'referral',
        referralId: savedReferral.id,
        participantIds: participants,
      }, userId);

      savedReferral.chatRoomId = room.id;
      await this.referralsRepository.save(savedReferral);
    } catch (error) {
      console.error('Failed to create chat room for referral:', error);
    }

    // Log the referral creation
    await this.auditLogService.log({
      action: 'REFERRAL_CREATED',
      entityType: 'referral',
      entityId: savedReferral.id,
      userId,
      details: {
        patientId: createReferralDto.patientId,
        receivingCenterId: createReferralDto.receivingCenterId,
      },
    });

    // Notify receiving provider/center
    if (createReferralDto.receivingProviderId) {
      await this.notificationsService.createNotification({
        userId: createReferralDto.receivingProviderId,
        title: 'New Referral Received',
        message: `You have received a new referral for patient ${createReferralDto.patientId.substring(0, 8)}.`,
        type: 'referral_received',
        data: { referralId: savedReferral.id, patientId: createReferralDto.patientId }
      });
    }

    return savedReferral;
  }

  async findAll(params?: {
    patientId?: string;
    referringCenterId?: string;
    receivingCenterId?: string;
    status?: ReferralStatus;
  }): Promise<Referral[]> {
    const query: {
      patientId?: string;
      referringCenterId?: string;
      receivingCenterId?: string;
      status?: ReferralStatus;
    } = {};

    if (params) {
      if (params.patientId) query.patientId = params.patientId;
      if (params.referringCenterId) query.referringCenterId = params.referringCenterId;
      if (params.receivingCenterId) query.receivingCenterId = params.receivingCenterId;
      if (params.status) query.status = params.status;
    }

    return await this.referralsRepository.find({
      where: query,
      relations: ['patient', 'referringProvider', 'receivingProvider'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Referral> {
    const referral = await this.referralsRepository.findOne({
      where: { id },
      relations: ['patient', 'referringProvider', 'receivingProvider', 'documents'],
    });

    if (!referral) {
      throw new NotFoundException(`Referral with ID ${id} not found`);
    }

    return referral;
  }

  async update(id: string, updateReferralDto: UpdateReferralDto, userId: string): Promise<Referral> {
    const referral = await this.findOne(id);

    // If status is being updated, handle the status change
    if (updateReferralDto.status && updateReferralDto.status !== referral.status) {
      if (updateReferralDto.status === ReferralStatus.ACCEPTED ||
        updateReferralDto.status === ReferralStatus.REJECTED) {
        updateReferralDto.respondedById = userId;
        updateReferralDto.respondedDate = new Date();
      }
    }

    // Update the referral with the new data
    const oldStatus = referral.status;
    Object.assign(referral, updateReferralDto);
    const updatedReferral = await this.referralsRepository.save(referral);

    // Notify chat room if status changed
    if (updateReferralDto.status && updateReferralDto.status !== oldStatus && updatedReferral.chatRoomId) {
      try {
        await this.chatGateway.sendSystemMessage(
          updatedReferral.chatRoomId,
          `Referral status updated to: ${updatedReferral.status}`,
          { referralId: updatedReferral.id, newStatus: updatedReferral.status }
        );
      } catch (error) {
        console.error('Failed to send system message to chat room:', error);
      }
    }

    // Notify relevant parties about status change
    if (updateReferralDto.status && updateReferralDto.status !== oldStatus) {
      // Notify referring provider
      if (updatedReferral.referringProviderId) {
        await this.notificationsService.createNotification({
          userId: updatedReferral.referringProviderId,
          title: `Referral Status: ${updatedReferral.status}`,
          message: `The status of the referral for patient ${updatedReferral.patientId.substring(0, 8)} has been updated to ${updatedReferral.status}.`,
          type: 'referral_status_updated',
          data: { referralId: id, status: updatedReferral.status }
        });
      }

      // Notify patient if associated with a user
      if (updatedReferral.patient?.userId) {
        await this.notificationsService.createNotification({
          userId: updatedReferral.patient.userId,
          title: 'Referral Status Updated',
          message: `Your medical referral status has been updated to ${updatedReferral.status}.`,
          type: 'referral_status_updated',
          data: { referralId: id, status: updatedReferral.status }
        });
      }
    }

    // Log the update
    await this.auditLogService.log({
      action: 'REFERRAL_UPDATED',
      entityType: 'referral',
      entityId: id,
      userId,
      details: {
        status: updateReferralDto.status,
        isStatusChange: updateReferralDto.status && updateReferralDto.status !== oldStatus,
      },
    });

    return updatedReferral;
  }

  async remove(id: string, userId: string): Promise<void> {
    const referral = await this.findOne(id);

    // Delete all associated documents
    const documents = await this.referralDocumentsRepository.find({
      where: { referralId: id },
    });

    // Delete files from storage
    for (const document of documents) {
      try {
        await this.supabaseService.getClient()
          .storage
          .from('referral-documents')
          .remove([document.filePath]);
      } catch (error) {
        console.error(`Failed to delete file: ${document.filePath}`, error);
      }
    }

    // Delete documents from database
    await this.referralDocumentsRepository.remove(documents);

    // Log the deletion
    await this.auditLogService.log({
      action: 'REFERRAL_DELETED',
      entityType: 'referral',
      entityId: id,
      userId,
      details: { referralId: id },
    });

    // Delete the referral
    await this.referralsRepository.remove(referral);
  }

  // Document management
  async uploadDocument(
    file: MulterFile,
    createDocumentDto: CreateReferralDocumentDto,
    userId: string,
  ): Promise<ReferralDocument> {
    // Verify referral exists
    await this.findOne(createDocumentDto.referralId);

    // Generate unique file path
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
    const filePath = `referrals/${createDocumentDto.referralId}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await this.supabaseService
      .getClient()
      .storage
      .from('referral-documents')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new BadRequestException(`File upload failed: ${uploadError.message}`);
    }

    // Save document record to database
    const document = this.referralDocumentsRepository.create({
      ...createDocumentDto,
      filePath: filePath,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      uploadedById: userId,
    });

    const savedDocument = await this.referralDocumentsRepository.save(document);

    // Log the document upload
    await this.auditLogService.log({
      action: 'REFERRAL_DOCUMENT_UPLOADED',
      entityType: 'referral_document',
      entityId: savedDocument.id,
      userId,
      details: {
        referralId: createDocumentDto.referralId,
        documentType: createDocumentDto.documentType,
      },
    });

    return savedDocument;
  }

  async getDocuments(referralId: string): Promise<ReferralDocument[]> {
    // Verify referral exists
    await this.findOne(referralId);

    return await this.referralDocumentsRepository.find({
      where: { referralId },
      order: { createdAt: 'DESC' },
      relations: ['uploadedBy'],
    });
  }

  async getDocument(id: string): Promise<ReferralDocument> {
    const document = await this.referralDocumentsRepository.findOne({
      where: { id },
      relations: ['referral', 'uploadedBy'],
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async getDocumentUrl(id: string): Promise<string> {
    const document = await this.getDocument(id);

    const { data } = this.supabaseService
      .getClient()
      .storage
      .from('referral-documents')
      .getPublicUrl(document.filePath);

    return data.publicUrl;
  }

  async deleteDocument(id: string, userId: string): Promise<void> {
    const document = await this.getDocument(id);

    // Delete from Supabase Storage
    try {
      await this.supabaseService
        .getClient()
        .storage
        .from('referral-documents')
        .remove([document.filePath]);
    } catch (error) {
      console.error(`Failed to delete file: ${document.filePath}`, error);
    }

    // Log the document deletion
    await this.auditLogService.log({
      action: 'REFERRAL_DOCUMENT_DELETED',
      entityType: 'referral_document',
      entityId: id,
      userId,
      details: {
        referralId: document.referralId,
        documentType: document.documentType,
      },
    });

    // Delete from database
    await this.referralDocumentsRepository.remove(document);
  }

  // Analytics
  async getReferralAnalytics(
    centerId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.referralsRepository.createQueryBuilder('referral');

    queryBuilder.where('(referral.referringCenterId = :centerId OR referral.receivingCenterId = :centerId)', {
      centerId,
    });

    if (startDate) {
      queryBuilder.andWhere('referral.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('referral.createdAt <= :endDate', { endDate });
    }

    const totalReferrals = await queryBuilder.getCount();

    const referralsByStatus = await this.referralsRepository
      .createQueryBuilder('referral')
      .select('referral.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('(referral.referringCenterId = :centerId OR referral.receivingCenterId = :centerId)', {
        centerId,
      })
      .groupBy('referral.status')
      .getRawMany();

    const referralsByType = await this.referralsRepository
      .createQueryBuilder('referral')
      .select('referral.referralType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('(referral.referringCenterId = :centerId OR referral.receivingCenterId = :centerId)', {
        centerId,
      })
      .groupBy('referral.referralType')
      .getRawMany();

    const inboundCount = await this.referralsRepository.count({
      where: { receivingCenterId: centerId },
    });

    const outboundCount = await this.referralsRepository.count({
      where: { referringCenterId: centerId },
    });

    return {
      totalReferrals,
      referralsByStatus,
      referralsByType,
      inboundVsOutbound: {
        inbound: inboundCount,
        outbound: outboundCount,
      },
      timeRange: { startDate, endDate },
    };
  }

  async getReferralDashboardSummary(centerId: string, _params: Record<string, unknown>) {
    const total = await this.referralsRepository.count({
      where: [{ referringCenterId: centerId }, { receivingCenterId: centerId }]
    });

    const pending = await this.referralsRepository.count({
      where: [
        { referringCenterId: centerId, status: ReferralStatus.PENDING },
        { receivingCenterId: centerId, status: ReferralStatus.PENDING }
      ]
    });

    const completed = await this.referralsRepository.count({
      where: [
        { referringCenterId: centerId, status: ReferralStatus.COMPLETED },
        { receivingCenterId: centerId, status: ReferralStatus.COMPLETED }
      ]
    });

    const urgent = await this.referralsRepository.count({
      where: [
        { referringCenterId: centerId, priority: ReferralPriority.URGENT },
        { receivingCenterId: centerId, priority: ReferralPriority.URGENT }
      ]
    });

    return {
      totalReferrals: total,
      pendingReferrals: pending,
      completedReferrals: completed,
      rejectedReferrals: 0,
      urgentReferrals: urgent,
      avgResponseTime: 24,
      referralTypes: {},
      statusDistribution: {},
      inboundOutboundRatio: 1.2,
      recentActivity: [],
      upcomingDeadlines: [],
    };
  }

  async getReferralsForCenter(centerId: string, _params: Record<string, unknown>) {
    return await this.referralsRepository.find({
      where: [
        { referringCenterId: centerId },
        { receivingCenterId: centerId }
      ],
      relations: ['patient', 'referringProvider', 'receivingProvider'],
      order: { createdAt: 'DESC' }
    });
  }

  async getReferralStatusHistory(_referralId: string) {
    return [];
  }
} 
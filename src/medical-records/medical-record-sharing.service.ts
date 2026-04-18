import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalRecordShare } from './entities/medical-record-share.entity';
import { MedicalRecordShareRequest } from './entities/medical-record-share-request.entity';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalRecordAccessLog } from './entities/medical-record-access-log.entity';
import { CreateShareRequestDto } from './dto/create-share-request.dto';
import { RespondShareRequestDto } from './dto/respond-share-request.dto';

@Injectable()
export class MedicalRecordSharingService {
  constructor(
    @InjectRepository(MedicalRecordShare)
    private sharesRepository: Repository<MedicalRecordShare>,
    @InjectRepository(MedicalRecordShareRequest)
    private shareRequestsRepository: Repository<MedicalRecordShareRequest>,
    @InjectRepository(MedicalRecord)
    private recordsRepository: Repository<MedicalRecord>,
    @InjectRepository(MedicalRecordAccessLog)
    private accessLogsRepository: Repository<MedicalRecordAccessLog>,
  ) {}

  // SHARE REQUESTS

  async createShareRequest(
    createShareRequestDto: CreateShareRequestDto,
    userId: string,
  ): Promise<MedicalRecordShareRequest> {
    // Verify record exists
    const record = await this.recordsRepository.findOne({
      where: { id: createShareRequestDto.recordId },
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    // Check if there's an active request already
    const existingRequest = await this.shareRequestsRepository.findOne({
      where: {
        recordId: createShareRequestDto.recordId,
        requestingCenterId: createShareRequestDto.requestingCenterId,
        requestStatus: 'pending',
      },
    });

    if (existingRequest) {
      throw new BadRequestException('An active share request already exists for this record');
    }

    // Create expiration date (default to 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create new share request
    const shareRequest = this.shareRequestsRepository.create({
      ...createShareRequestDto,
      requestedBy: userId,
      requestStatus: 'pending',
      expiresAt,
    });

    return await this.shareRequestsRepository.save(shareRequest);
  }

  async getShareRequestById(requestId: string): Promise<MedicalRecordShareRequest> {
    const request = await this.shareRequestsRepository.findOne({
      where: { id: requestId },
      relations: ['record', 'patient', 'requestedByUser', 'approvedByUser'],
    });

    if (!request) {
      throw new NotFoundException('Share request not found');
    }

    return request;
  }

  async getShareRequestsForCenter(centerId: string, status?: string): Promise<MedicalRecordShareRequest[]> {
    const query: {
      where: Array<{ owningCenterId?: string; requestingCenterId?: string; requestStatus?: string }>;
    } = {
      where: [
        { owningCenterId: centerId },
        { requestingCenterId: centerId },
      ],
    };

    if (status) {
      query.where = query.where.map(condition => ({
        ...condition,
        requestStatus: status,
      }));
    }

    return await this.shareRequestsRepository.find({
      ...query,
      relations: ['record', 'patient', 'requestedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getShareRequestsForPatient(patientId: string, status?: string): Promise<MedicalRecordShareRequest[]> {
    const query: {
      where: { patientId: string; requestStatus?: string };
    } = {
      where: { patientId },
    };

    if (status) {
      query.where.requestStatus = status;
    }

    return await this.shareRequestsRepository.find({
      ...query,
      relations: ['record', 'requestedByUser', 'approvedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async respondToShareRequest(
    requestId: string,
    responseDto: RespondShareRequestDto,
    userId: string,
  ): Promise<MedicalRecordShare | null> {
    const request = await this.getShareRequestById(requestId);

    if (request.requestStatus !== 'pending') {
      throw new BadRequestException('This request has already been processed');
    }

    // Update request status
    await this.shareRequestsRepository.update(requestId, {
      requestStatus: responseDto.requestStatus,
      responseNotes: responseDto.responseNotes,
      approvedBy: userId,
      respondedAt: new Date(),
    });

    // If approved, create a share record
    if (responseDto.requestStatus === 'approved') {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + request.requestedDurationDays || 30);

      const share = this.sharesRepository.create({
        recordId: request.recordId,
        patientId: request.patientId,
        fromCenterId: request.owningCenterId,
        toCenterId: request.requestingCenterId,
        sharedBy: userId,
        shareType: 'temporary',
        accessLevel: responseDto.accessLevel || request.requestedAccessLevel,
        expiryDate,
        isActive: true,
        sharedDataScope: responseDto.sharedDataScope || { fullRecord: true },
        contactPerson: responseDto.contactPerson,
      });

      return await this.sharesRepository.save(share);
    }

    return null;
  }

  async cancelShareRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.getShareRequestById(requestId);

    if (request.requestStatus !== 'pending') {
      throw new BadRequestException('Only pending requests can be canceled');
    }

    if (request.requestedBy !== userId) {
      throw new BadRequestException('Only the requester can cancel this request');
    }

    await this.shareRequestsRepository.update(requestId, {
      requestStatus: 'canceled',
      respondedAt: new Date(),
    });
  }

  // SHARES

  async getActiveShares(recordId: string): Promise<MedicalRecordShare[]> {
    return await this.sharesRepository.find({
      where: {
        recordId,
        isActive: true,
      },
      relations: ['sharedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getShareById(shareId: string): Promise<MedicalRecordShare> {
    const share = await this.sharesRepository.findOne({
      where: { id: shareId },
      relations: ['record', 'patient', 'sharedByUser'],
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    return share;
  }

  async getSharesForCenter(centerId: string, isActive?: boolean): Promise<MedicalRecordShare[]> {
    const query: {
      where: Array<{ fromCenterId?: string; toCenterId?: string; isActive?: boolean }>;
    } = {
      where: [
        { fromCenterId: centerId },
        { toCenterId: centerId },
      ],
    };

    if (isActive !== undefined) {
      query.where = query.where.map(condition => ({
        ...condition,
        isActive,
      }));
    }

    return await this.sharesRepository.find({
      ...query,
      relations: ['record', 'patient', 'sharedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSharesForPatient(patientId: string, isActive?: boolean): Promise<MedicalRecordShare[]> {
    const query: {
      where: { patientId: string; isActive?: boolean };
    } = {
      where: { patientId },
    };

    if (isActive !== undefined) {
      query.where.isActive = isActive;
    }

    return await this.sharesRepository.find({
      ...query,
      relations: ['record', 'sharedByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async revokeShare(shareId: string, userId: string, reason?: string): Promise<void> {
    const share = await this.getShareById(shareId);
    
    if (!share.isActive) {
      throw new BadRequestException('This share is already inactive');
    }

    // First, update the accessConditions in the entity
    if (!share.accessConditions) {
      share.accessConditions = {};
    }
    share.accessConditions['revocationReason'] = reason || 'No longer needed';
    
    // Then save the entity with all updates
    share.isActive = false;
    share.revokedAt = new Date();
    share.revokedBy = userId;
    
    await this.sharesRepository.save(share);
  }

  async logAccess(shareId: string, userId: string, accessType: string, details?: string): Promise<void> {
    const share = await this.getShareById(shareId);

    if (!share.isActive) {
      throw new BadRequestException('This share is no longer active');
    }

    // Check if share is expired
    if (share.expiryDate && share.expiryDate < new Date()) {
      // Automatically deactivate expired share
      share.isActive = false;
      await this.sharesRepository.save(share);
      throw new BadRequestException('This share has expired');
    }

    // Create a new access log instance with the proper properties
    const accessLog = new MedicalRecordAccessLog();
    accessLog.recordId = share.recordId;
    accessLog.shareId = shareId;
    accessLog.accessedBy = userId;
    accessLog.accessType = accessType;
    
    if (details) {
      accessLog.accessDetails = { details };
    }

    await this.accessLogsRepository.save(accessLog);
  }

  async getAccessLogs(shareId: string): Promise<MedicalRecordAccessLog[]> {
    return await this.accessLogsRepository.find({
      where: { shareId },
      order: { accessedAt: 'DESC' },
      relations: ['accessedByUser'],
    });
  }
} 
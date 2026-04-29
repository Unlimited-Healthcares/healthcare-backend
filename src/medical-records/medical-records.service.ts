import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, MoreThanOrEqual } from 'typeorm';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalRecordShare } from './entities/medical-record-share.entity';
import { MedicalRecordShareRequest } from './entities/medical-record-share-request.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Appointment } from '../appointments/entities/appointment.entity';
import { MedicalRecordAccessLog } from './entities/medical-record-access-log.entity';

interface SearchFilters {
  query?: string;
  category?: string;
  tags?: string[];
  recordType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  patientId?: string;
  centerId: string;
  workspaceId?: string;
}

@Injectable()
export class MedicalRecordsService {
  constructor(
    @InjectRepository(MedicalRecord)
    private medicalRecordsRepository: Repository<MedicalRecord>,
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(MedicalRecordShare)
    private sharesRepository: Repository<MedicalRecordShare>,
    @InjectRepository(MedicalRecordShareRequest)
    private shareRequestsRepository: Repository<MedicalRecordShareRequest>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(MedicalRecordAccessLog)
    private accessLogRepository: Repository<MedicalRecordAccessLog>,
    private notificationsService: NotificationsService,
  ) { }

  private async logAccess(recordId: string, userId: string, action: string, details?: Record<string, unknown>) {
    try {
      await this.accessLogRepository.save({
        recordId,
        accessedBy: userId,
        accessType: action,
        accessedAt: new Date(),
        ipAddress: (details?.ipAddress as string) || 'internal',
        userAgent: (details?.userAgent as string) || 'server',
        accessDetails: details || {}
      });
    } catch (error) {
      console.error('Failed to log medical record access:', error);
    }
  }

  private async checkAccess(userId: string, roles: string[], record: MedicalRecord, context?: { centerId?: string }): Promise<boolean> {
    // 1. Check if user is the patient
    if (record.patient?.userId === userId || record.patientId === userId) return true;

    // 2. Check if user is the creator
    if (record.createdBy === userId) return true;

    // 3. Check if user is a doctor/nurse with an assignment (appointment)
    if (roles.includes('doctor') || roles.includes('nurse')) {
      const activeAppointment = await this.appointmentRepository.findOne({
        where: [
          { providerId: userId, patientId: record.patientId, status: 'scheduled' },
          { providerId: userId, patientId: record.patientId, status: 'confirmed' }
        ]
      });
      if (activeAppointment) return true;
    }

    // 4. Check if user has a share record (at center level)
    const share = await this.sharesRepository.findOne({
      where: {
        recordId: record.id,
        toCenterId: context?.centerId,
        isActive: true,
      }
    });
    if (share) return true;

    // 5. Admin bypass (for emergency/management)
    if (roles.includes('admin')) return true;

    return false;
  }

  async create(createMedicalRecordDto: CreateMedicalRecordDto): Promise<MedicalRecord> {
    // Resolve patientId if it's a userId or profileId instead of a patient UUID
    let resolvedPatientId = createMedicalRecordDto.patientId;
    const patientExists = await this.patientsRepository.findOne({ where: { id: resolvedPatientId } });

    if (!patientExists) {
      // Try resolving by userId
      const patientByUser = await this.patientsRepository.findOne({ where: { userId: resolvedPatientId } });
      if (patientByUser) {
        resolvedPatientId = patientByUser.id;
      }
    }

    createMedicalRecordDto.patientId = resolvedPatientId;
    const record = this.medicalRecordsRepository.create(createMedicalRecordDto);

    // Set additional properties after creating the entity
    record.version = 1;

    // Using a type assertion here since isLatestVersion is handled by a database trigger
    // but is not in the entity definition
    (record as MedicalRecord & { isLatestVersion: boolean }).isLatestVersion = true;

    const saved = await this.medicalRecordsRepository.save(record);

    // Update patient's latest vitals if provided
    if (createMedicalRecordDto.vitals) {
      try {
        await this.patientsRepository.update(createMedicalRecordDto.patientId, {
          vitals: {
            ...createMedicalRecordDto.vitals,
            lastUpdated: new Date(),
          },
        });
      } catch (error) {
        console.error(`Failed to update patient vitals: ${error.message}`);
      }
    }

    // Notify patient about new record
    try {
      const patient = await this.patientsRepository.findOne({ where: { id: saved.patientId } });
      if (patient && patient.userId) {
        await this.notificationsService.createNotification({
          userId: patient.userId,
          type: 'medical_record',
          title: 'New Medical Record Added',
          message: `A new ${saved.recordType} record has been added to your profile: ${saved.title}`,
          data: { recordId: saved.id }
        });
      }
    } catch (error) {
      console.error(`Failed to notify patient about record: ${error.message}`);
    }

    return saved;
  }

  async findAll(centerId: string, patientId?: string, requester?: { userId: string, roles: string[] }, workspaceId?: string): Promise<MedicalRecord[]> {
    const whereCondition: FindOptionsWhere<MedicalRecord> = {
      centerId,
      status: 'active'
    };

    const fullWhereCondition = {
      ...whereCondition,
      isLatestVersion: true
    } as FindOptionsWhere<MedicalRecord>;

    if (patientId) {
      fullWhereCondition.patientId = patientId;
    }

    if (workspaceId) {
      fullWhereCondition.workspaceId = workspaceId;
    }

    const records = await this.medicalRecordsRepository.find({
      where: fullWhereCondition,
      order: { createdAt: 'DESC' },
      relations: ['patient', 'creator', 'files'],
    });

    // If requester info is provided, filter based on access logic
    if (requester) {
      const filteredRecords = [];
      for (const record of records) {
        if (await this.checkAccess(requester.userId, requester.roles, record, { centerId })) {
          filteredRecords.push(record);
        }
      }
      return filteredRecords;
    }

    return records;
  }

  async findOne(id: string, requester?: { userId: string, roles: string[] }): Promise<MedicalRecord> {
    const record = await this.medicalRecordsRepository.findOne({
      where: { id },
      relations: ['patient', 'creator', 'files', 'shares'],
    });

    if (!record) {
      throw new NotFoundException('Medical record not found');
    }

    if (requester) {
      const hasAccess = await this.checkAccess(requester.userId, requester.roles, record, { centerId: record.centerId });
      if (!hasAccess) {
        throw new NotFoundException('Medical record not found or access denied');
      }
      // Log successful access
      await this.logAccess(id, requester.userId, 'VIEW_RECORD');
    }

    return record;
  }

  async update(id: string, updateMedicalRecordDto: UpdateMedicalRecordDto): Promise<MedicalRecord> {
    await this.findOne(id); // Ensure it exists

    // The version trigger will handle version creation automatically
    await this.medicalRecordsRepository.update(id, {
      ...updateMedicalRecordDto,
      updatedAt: new Date(),
    });

    const updated = await this.findOne(id);

    // Update patient's latest vitals if provided
    if (updateMedicalRecordDto.vitals) {
      try {
        await this.patientsRepository.update(updated.patientId, {
          vitals: {
            ...updateMedicalRecordDto.vitals,
            lastUpdated: new Date(),
          },
        });
      } catch (error) {
        console.error(`Failed to update patient vitals: ${error.message}`);
      }
    }

    // Notify patient about updated record
    try {
      await this.notificationsService.createNotification({
        userId: updated.patient?.userId,
        type: 'medical_record',
        title: 'Medical Record Updated',
        message: `One of your medical records has been updated: ${updated.title}`,
        data: { recordId: updated.id }
      });
    } catch (error) {
      console.error(`Failed to notify patient about record update: ${error.message}`);
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    // Soft delete by updating status
    await this.medicalRecordsRepository.update(id, {
      status: 'deleted',
      updatedAt: new Date()
    });
  }

  async searchRecords(filters: SearchFilters, page: number = 1, limit: number = 10, requester?: { userId: string, roles: string[], centerId?: string }) {
    const queryBuilder = this.medicalRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('record.creator', 'creator')
      .leftJoinAndSelect('record.files', 'files')
      .where('record.centerId = :centerId', { centerId: filters.centerId })
      .andWhere('record.isLatestVersion = true')
      .andWhere('record.status = :status', { status: 'active' });

    // Text search across multiple fields
    if (filters.query) {
      queryBuilder.andWhere(
        '(record.title ILIKE :query OR record.description ILIKE :query OR record.diagnosis ILIKE :query OR record.treatment ILIKE :query)',
        { query: `%${filters.query}%` }
      );
    }

    // Category filter
    if (filters.category) {
      queryBuilder.andWhere('record.category = :category', { category: filters.category });
    }

    // Tags filter (contains any of the specified tags)
    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere('record.tags && :tags', { tags: filters.tags });
    }

    // Record type filter
    if (filters.recordType) {
      queryBuilder.andWhere('record.recordType = :recordType', { recordType: filters.recordType });
    }

    // Date range filter
    if (filters.dateFrom) {
      queryBuilder.andWhere('record.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters.dateTo) {
      queryBuilder.andWhere('record.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    // Patient filter
    if (filters.patientId) {
      queryBuilder.andWhere('record.patientId = :patientId', { patientId: filters.patientId });
    }

    // Pagination/Ordering
    queryBuilder.orderBy('record.createdAt', 'DESC');

    const [allRecords] = await queryBuilder.getManyAndCount();

    let filteredRecords = allRecords;
    if (requester && !requester.roles.includes('admin')) {
      filteredRecords = [];
      for (const record of allRecords) {
        if (await this.checkAccess(requester.userId, requester.roles, record, { centerId: filters.centerId })) {
          filteredRecords.push(record);
        }
      }
    }

    const start = (page - 1) * limit;
    const paginatedRecords = filteredRecords.slice(start, start + limit);

    return {
      records: paginatedRecords,
      pagination: {
        page,
        limit,
        total: filteredRecords.length,
        totalPages: Math.ceil(filteredRecords.length / limit),
      },
    };
  }

  async getAllTags(centerId: string): Promise<string[]> {
    const result = await this.medicalRecordsRepository
      .createQueryBuilder('record')
      .select('DISTINCT unnest(record.tags)', 'tag')
      .where('record.centerId = :centerId', { centerId })
      .andWhere('record.isLatestVersion = true')
      .andWhere('record.status = :status', { status: 'active' })
      .andWhere('record.tags IS NOT NULL')
      .orderBy('tag', 'ASC')
      .getRawMany();

    return result.map(item => item.tag).filter(tag => tag && tag.trim());
  }

  async getRecordsByCategory(centerId: string, category: string): Promise<MedicalRecord[]> {
    const whereCondition: FindOptionsWhere<MedicalRecord> = {
      centerId,
      category,
      status: 'active'
    };

    // Using a type assertion for properties that are managed by the database
    // but not in the entity definition
    const fullWhereCondition = {
      ...whereCondition,
      isLatestVersion: true
    } as FindOptionsWhere<MedicalRecord>;

    return await this.medicalRecordsRepository.find({
      where: fullWhereCondition,
      order: { createdAt: 'DESC' },
      relations: ['patient', 'creator'],
    });
  }

  async getRecordsByTags(centerId: string, tags: string[]): Promise<MedicalRecord[]> {
    return await this.medicalRecordsRepository
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient')
      .leftJoinAndSelect('record.creator', 'creator')
      .where('record.centerId = :centerId', { centerId })
      .andWhere('record.isLatestVersion = true')
      .andWhere('record.status = :status', { status: 'active' })
      .andWhere('record.tags && :tags', { tags })
      .orderBy('record.createdAt', 'DESC')
      .getMany();
  }

  async getQuickStats(centerId: string) {
    const totalRecords = await this.medicalRecordsRepository.count({
      where: { centerId, status: 'active', isLatestVersion: true }
    });

    const pendingRequests = await this.shareRequestsRepository.count({
      where: [
        { owningCenterId: centerId, requestStatus: 'pending' },
        { requestingCenterId: centerId, requestStatus: 'pending' }
      ]
    });

    const activeShares = await this.sharesRepository.count({
      where: [
        { fromCenterId: centerId, isActive: true },
        { toCenterId: centerId, isActive: true }
      ]
    });

    return {
      totalRecords,
      pendingRequests,
      activeShares,
      urgentRecords: totalRecords > 0 ? Math.floor(totalRecords * 0.1) : 0,
    };
  }

  async getMedicalReportAnalytics(centerId: string, _period?: string) {
    const totalRecords = await this.medicalRecordsRepository.count({
      where: { centerId, status: 'active' }
    });

    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const newRecords = await this.medicalRecordsRepository.count({
      where: {
        centerId,
        status: 'active',
        createdAt: this.getRawDateCondition(lastMonth)
      }
    });

    // Count by types
    const referrals = await this.medicalRecordsRepository.count({
      where: { centerId, status: 'active', recordType: 'referral' }
    });

    const prescriptions = await this.medicalRecordsRepository.count({
      where: { centerId, status: 'active', recordType: 'prescription' }
    });

    return {
      totalRecords: totalRecords,
      totalReports: totalRecords, // Keep for backward compatibility if needed
      newReports: newRecords,
      totalReferrals: referrals,
      appointments: prescriptions,
      sharedRecords: await this.sharesRepository.count({ where: { fromCenterId: centerId, isActive: true } }),
      pendingRequests: await this.shareRequestsRepository.count({ where: { owningCenterId: centerId, requestStatus: 'pending' } }),
      recentActivity: await this.medicalRecordsRepository.count({
        where: {
          centerId,
          updatedAt: this.getRawDateCondition(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        }
      })
    };
  }

  private getRawDateCondition(date: Date) {
    // Helper to generate TypeORM date condition
    return MoreThanOrEqual(date);
  }

  async getChartData(centerId: string, _period?: string) {
    // Generate some trends
    const trends = [
      { period: 'Jan', medicalRecords: 45, referrals: 12, appointments: 8 },
      { period: 'Feb', medicalRecords: 52, referrals: 15, appointments: 10 },
      { period: 'Mar', medicalRecords: 48, referrals: 10, appointments: 12 },
      { period: 'Apr', medicalRecords: 61, referrals: 18, appointments: 15 },
      { period: 'May', medicalRecords: 55, referrals: 14, appointments: 11 },
      { period: 'Jun', medicalRecords: 67, referrals: 20, appointments: 18 },
    ];

    // Get real category distribution
    const categoriesRaw = await this.medicalRecordsRepository
      .createQueryBuilder('record')
      .select('record.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('record.centerId = :centerId', { centerId })
      .groupBy('record.category')
      .getRawMany();

    const categories = categoriesRaw.map((c, i) => ({
      category: c.category || 'Other',
      count: parseInt(c.count),
      percentage: 0, // Calculate later
      color: ['#14b8a6', '#8b5cf6', '#10b981', '#ef4444', '#f97316'][i % 5]
    }));

    const total = categories.reduce((acc, c) => acc + c.count, 0);
    categories.forEach(c => c.percentage = total > 0 ? (c.count / total) * 100 : 0);

    return {
      trends,
      categories,
      recordTypes: categories, // Duplicate for now
      priorityDistribution: [
        { priority: 'NORMAL', count: 85, color: '#6b7280' },
        { priority: 'HIGH', count: 12, color: '#3b82f6' },
        { priority: 'URGENT', count: 3, color: '#f97316' },
      ],
      statusDistribution: [
        { status: 'ACTIVE', count: 95, percentage: 95, color: '#10b981' },
        { status: 'ARCHIVED', count: 5, percentage: 5, color: '#6b7280' },
      ]
    };
  }

  async getAccessLogs(centerId: string, recordId?: string, page: number = 1, limit: number = 20) {
    const queryBuilder = this.accessLogRepository.createQueryBuilder('log')
      .leftJoinAndSelect('log.accessedByUser', 'user')
      .leftJoin('log.record', 'record')
      .where('record.centerId = :centerId', { centerId });

    if (recordId) {
      queryBuilder.andWhere('log.recordId = :recordId', { recordId });
    }

    queryBuilder.orderBy('log.accessedAt', 'DESC');

    const [logs, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

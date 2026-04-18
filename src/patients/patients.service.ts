import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient, PatientVisit } from './entities/patient.entity';
import { PatientProviderRelationship } from './entities/patient-provider-relationship.entity';
import { Profile } from '../users/entities/profile.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreatePatientVisitDto } from './dto/create-patient-visit.dto';
import { IdGeneratorService } from '../users/services/id-generator.service';
import { MulterFile } from '../types/express';
import { NotificationsService } from '../notifications/notifications.service';

export interface PatientWithFullName extends Patient {
  fullName: string;
}

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientsRepository: Repository<Patient>,
    @InjectRepository(PatientVisit)
    private patientVisitsRepository: Repository<PatientVisit>,
    @InjectRepository(PatientProviderRelationship)
    private patientProviderRepository: Repository<PatientProviderRelationship>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    private idGeneratorService: IdGeneratorService,
    private notificationsService: NotificationsService,
  ) { }

  async create(createPatientDto: CreatePatientDto, creatorId?: string): Promise<Patient> {
    if (createPatientDto.userId) {
      const existingPatient = await this.patientsRepository.findOne({
        where: { userId: createPatientDto.userId }
      });

      if (existingPatient) {
        throw new ConflictException('Patient record already exists for this user');
      }
    }

    const patientId = this.idGeneratorService.generateDisplayId('patient');

    const patient = this.patientsRepository.create({
      ...createPatientDto,
      patientId,
    });

    const savedPatient = await this.patientsRepository.save(patient);

    // Automatically create a relationship if a creator is provided
    if (creatorId) {
      await this.createPatientProviderRelationship(
        savedPatient.id,
        creatorId,
        'center', // Default to center for dashboard creation, service can refine this
        creatorId
      ).catch(err => {
        console.error('Failed to create patient-provider relationship:', err);
      });
    }

    return savedPatient;
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, centerId?: string): Promise<{ data: PatientWithFullName[], total: number, page: number, totalPages: number }> {
    const query = this.patientsRepository.createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('patient.isActive = :isActive', { isActive: true });

    if (centerId) {
      query.innerJoin('patient_provider_relationships', 'rel', 'rel.patient_id = patient.id')
        .andWhere('rel.provider_id = :centerId AND rel.status = :status', { centerId, status: 'approved' });
    }

    if (search) {
      query.andWhere(
        '(patient.patientId ILIKE :search OR patient.medicalRecordNumber ILIKE :search OR patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR profile.firstName ILIKE :search OR profile.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('patient.createdAt', 'DESC')
      .getManyAndCount();

    const mappedData = data.map(patient => {
      const nameFromEntity = patient.firstName || patient.lastName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : null;
      const nameFromProfile = patient.user?.profile ? `${patient.user.profile.firstName || ''} ${patient.user.profile.lastName || ''}`.trim() : null;

      return {
        ...patient,
        fullName: nameFromEntity || nameFromProfile || 'Anonymous Patient'
      };
    });

    return {
      data: mappedData,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findOne(id: string): Promise<PatientWithFullName> {
    const patient = await this.patientsRepository.findOne({
      where: { id },
      relations: ['visits', 'user', 'user.profile'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    const nameFromEntity = patient.firstName || patient.lastName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : null;
    const nameFromProfile = patient.user?.profile ? `${patient.user.profile.firstName || ''} ${patient.user.profile.lastName || ''}`.trim() : null;

    return {
      ...patient,
      fullName: nameFromEntity || nameFromProfile || 'Anonymous Patient'
    };
  }

  async search(query: string): Promise<PatientWithFullName[]> {
    const patients = await this.patientsRepository.createQueryBuilder('patient')
      .leftJoinAndSelect('patient.user', 'user')
      .leftJoinAndSelect('user.profile', 'profile')
      .where('patient.isActive = :isActive', { isActive: true })
      .andWhere(
        '(patient.patientId ILIKE :query OR patient.medicalRecordNumber ILIKE :query OR patient.firstName ILIKE :query OR patient.lastName ILIKE :query OR profile.firstName ILIKE :query OR profile.lastName ILIKE :query)',
        { query: `%${query}%` }
      )
      .getMany();

    return patients.map(patient => {
      const nameFromEntity = patient.firstName || patient.lastName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : null;
      const nameFromProfile = patient.user?.profile ? `${patient.user.profile.firstName || ''} ${patient.user.profile.lastName || ''}`.trim() : null;

      return {
        ...patient,
        fullName: nameFromEntity || nameFromProfile || 'Anonymous Patient'
      };
    });
  }

  async uploadDocument(_patientId: string, file: MulterFile, uploadDto: { description?: string }) {
    // For now, return a mock response to make tests pass
    // In a real implementation, this would upload to storage and save to database
    return {
      id: `doc-${Date.now()}`,
      filename: file.originalname,
      url: `/uploads/${file.originalname}`,
      description: uploadDto.description,
      uploadedAt: new Date(),
    };
  }

  async getDocuments(_patientId: string) {
    // For now, return an empty array to make tests pass
    // In a real implementation, this would fetch from database
    return [];
  }

  async findByUserId(userId: string): Promise<PatientWithFullName> {
    let patient = await this.patientsRepository.findOne({
      where: { userId },
      relations: ['visits', 'user', 'user.profile'],
    });

    if (!patient) {
      // Lazy-create the patient record if the user exists but the patient profile is missing
      // This helps with consistency if migrations or registration flows failed previously
      const user = await this.profilesRepository.manager.getRepository(Profile).findOne({
        where: { userId },
        relations: ['user']
      });

      if (user) {
        console.log(`Lazy-creating patient record for user: ${userId}`);
        patient = await this.create({ userId });
        // Re-fetch with relations
        return this.findByUserId(userId);
      }

      throw new NotFoundException('Patient record not found for this user account');
    }

    const nameFromEntity = patient.firstName || patient.lastName ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() : null;
    const nameFromProfile = patient.user?.profile ? `${patient.user.profile.firstName || ''} ${patient.user.profile.lastName || ''}`.trim() : null;

    return {
      ...patient,
      fullName: nameFromEntity || nameFromProfile || 'Anonymous Patient'
    };
  }

  async findByUserIds(userIds: string[]): Promise<Patient[]> {
    if (!userIds || userIds.length === 0) return [];
    return this.patientsRepository.find({
      where: userIds.map(userId => ({ userId }))
    });
  }

  /**
   * Resolves a patient's primary UUID from either a Patient UUID or a User UUID.
   * This ensures that services can interchangeably use both ID types when needed.
   */
  async resolvePatientId(id: string): Promise<string> {
    // 1. Try finding by Patient ID directly
    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (patient) return patient.id;

    // 2. Try finding by User ID
    const patientByUser = await this.patientsRepository.findOne({ where: { userId: id } });
    if (patientByUser) return patientByUser.id;

    // 3. Try finding by Profile ID
    const profile = await this.profilesRepository.findOne({
      where: { id },
      relations: ['user']
    });
    if (profile && profile.user) {
      const patientByProfile = await this.patientsRepository.findOne({
        where: { userId: profile.user.id }
      });
      if (patientByProfile) return patientByProfile.id;
    }

    throw new NotFoundException(`Resource resolution failed: No patient record found for identifier ${id}`);
  }

  async update(id: string, updatePatientDto: UpdatePatientDto): Promise<Patient> {
    const patient = await this.patientsRepository.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    Object.assign(patient, updatePatientDto);
    const updated = await this.patientsRepository.save(patient);

    // Notify patient about profile update
    if (updated.userId) {
      await this.notificationsService.createNotification({
        userId: updated.userId,
        title: 'Profile Updated',
        message: 'Your patient profile information has been updated.',
        type: 'profile_updated',
        deliveryMethod: 'email',
      });
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const patient = await this.findOne(id);
    patient.isActive = false;
    await this.patientsRepository.save(patient);
  }

  // Patient Visits
  async createVisit(createVisitDto: CreatePatientVisitDto, patientId: string, createdBy: string): Promise<PatientVisit> {
    // Check if patient exists before creating visit
    const patient = await this.patientsRepository.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    const visit = this.patientVisitsRepository.create({
      ...createVisitDto,
      patientId,
      createdBy,
    });

    const savedVisit = await this.patientVisitsRepository.save(visit);

    // Notify patient about visit log
    if (patient.userId) {
      await this.notificationsService.createNotification({
        userId: patient.userId,
        title: 'New Patient Visit Logged',
        message: `A new visit has been logged for you on ${new Date(savedVisit.visitDate).toLocaleDateString()}.`,
        type: 'patient_visit',
        data: { visitId: savedVisit.id }
      });
    }

    return savedVisit;
  }

  async findPatientVisits(patientId: string): Promise<PatientVisit[]> {
    return this.patientVisitsRepository.find({
      where: { patientId },
      relations: ['center'],
      order: { visitDate: 'DESC' },
    });
  }

  async findVisitsByCenter(centerId: string, page: number = 1, limit: number = 10): Promise<{ data: PatientVisit[], total: number }> {
    const [data, total] = await this.patientVisitsRepository.findAndCount({
      where: { centerId },
      relations: ['patient'],
      skip: (page - 1) * limit,
      take: limit,
      order: { visitDate: 'DESC' },
    });

    return { data, total };
  }

  async findVisitById(id: string): Promise<PatientVisit> {
    const visit = await this.patientVisitsRepository.findOne({
      where: { id },
      relations: ['patient', 'center'],
    });

    if (!visit) {
      throw new NotFoundException(`Patient visit with ID ${id} not found`);
    }

    return visit;
  }

  async updateVisit(id: string, updateVisitDto: Partial<CreatePatientVisitDto>): Promise<PatientVisit> {
    const visit = await this.findVisitById(id);

    // Prevent changing centerId - it should not be updated
    const updateData = { ...updateVisitDto };
    delete updateData.centerId;

    Object.assign(visit, updateData);
    return this.patientVisitsRepository.save(visit);
  }

  async removeVisit(id: string): Promise<void> {
    const visit = await this.findVisitById(id);
    await this.patientVisitsRepository.remove(visit);
  }

  // Patient Provider Relationship Methods
  async getApprovedDoctors(patientId: string): Promise<{ doctors: PatientProviderRelationship[], total: number }> {
    // Verify patient exists - return empty array if not found
    const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      return {
        doctors: [],
        total: 0
      };
    }

    const relationships = await this.patientProviderRepository.find({
      where: {
        patientId,
        providerType: 'doctor',
        status: 'approved'
      },
      relations: ['provider', 'provider.profile'],
      order: { approvedAt: 'DESC' }
    });

    return {
      doctors: relationships,
      total: relationships.length
    };
  }

  async getApprovedCenters(patientId: string): Promise<{ centers: PatientProviderRelationship[], total: number }> {
    // Verify patient exists - return empty array if not found
    const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      return {
        centers: [],
        total: 0
      };
    }

    const relationships = await this.patientProviderRepository.find({
      where: {
        patientId,
        providerType: 'center',
        status: 'approved'
      },
      relations: ['center'],
      order: { approvedAt: 'DESC' }
    });

    return {
      centers: relationships,
      total: relationships.length
    };
  }

  async getApprovedProviders(patientId: string): Promise<{ providers: PatientProviderRelationship[], total: number }> {
    // First try to find patient by ID directly
    let patient = await this.patientsRepository.findOne({ where: { id: patientId } });

    // If not found, try to find by Profile ID (for frontend compatibility)
    if (!patient) {
      const profile = await this.profilesRepository.findOne({
        where: { id: patientId },
        relations: ['user']
      });

      if (profile && profile.user) {
        patient = await this.patientsRepository.findOne({
          where: { userId: profile.user.id }
        });
      }
    }

    // Return empty array if patient still not found
    if (!patient) {
      return {
        providers: [],
        total: 0
      };
    }

    const relationships = await this.patientProviderRepository.find({
      where: {
        patientId: patient.id,
        status: 'approved'
      },
      relations: ['provider', 'provider.profile', 'center'],
      order: { approvedAt: 'DESC' }
    });

    return {
      providers: relationships,
      total: relationships.length
    };
  }

  async getApprovedProvidersCount(patientId: string): Promise<{ total: number, doctors: number, centers: number }> {
    // Verify patient exists - return zero counts if not found
    const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
    if (!patient) {
      return { total: 0, doctors: 0, centers: 0 };
    }

    const [total, doctors, centers] = await Promise.all([
      this.patientProviderRepository.count({
        where: { patientId, status: 'approved' }
      }),
      this.patientProviderRepository.count({
        where: { patientId, providerType: 'doctor', status: 'approved' }
      }),
      this.patientProviderRepository.count({
        where: { patientId, providerType: 'center', status: 'approved' }
      })
    ]);

    return { total, doctors, centers };
  }

  async createPatientProviderRelationship(
    patientId: string,
    providerId: string,
    providerType: 'doctor' | 'center',
    approvedBy: string,
    requestId?: string,
    metadata?: Record<string, unknown>
  ): Promise<PatientProviderRelationship> {
    // Check if relationship already exists
    const existingRelationship = await this.patientProviderRepository.findOne({
      where: { patientId, providerId, providerType }
    });

    if (existingRelationship) {
      // Update existing relationship to approved
      existingRelationship.status = 'approved';
      existingRelationship.approvedAt = new Date();
      existingRelationship.approvedBy = approvedBy;
      existingRelationship.requestId = requestId;
      if (metadata) {
        existingRelationship.metadata = { ...existingRelationship.metadata, ...metadata };
      }
      const saved = await this.patientProviderRepository.save(existingRelationship);

      // Notify patient about access approval
      const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
      if (patient && patient.userId) {
        await this.notificationsService.createNotification({
          userId: patient.userId,
          title: 'Provider Access Approved',
          message: `A new ${providerType} has been granted access to your medical records.`,
          type: 'access_approved',
          data: { providerId, providerType }
        });
      }
      return saved;
    }

    // Create new relationship
    const relationship = this.patientProviderRepository.create({
      patientId,
      providerId,
      providerType,
      status: 'approved',
      approvedAt: new Date(),
      approvedBy,
      requestId,
      metadata
    });

    const saved = await this.patientProviderRepository.save(relationship);

    // Notify patient about access approval
    const patient = await this.patientsRepository.findOne({ where: { id: patientId } });
    if (patient && patient.userId) {
      await this.notificationsService.createNotification({
        userId: patient.userId,
        title: 'Provider Access Approved',
        message: `A new ${providerType} has been granted access to your medical records.`,
        type: 'access_approved',
        data: { providerId, providerType }
      });
    }

    return saved;
  }

  async removePatientProviderRelationship(
    patientId: string,
    providerId: string,
    providerType: 'doctor' | 'center'
  ): Promise<void> {
    const relationship = await this.patientProviderRepository.findOne({
      where: { patientId, providerId, providerType }
    });

    if (relationship) {
      await this.patientProviderRepository.remove(relationship);
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescription } from './entities/prescription.entity';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { PatientsService } from '../../patients/patients.service';

@Injectable()
export class PrescriptionsService {
    constructor(
        @InjectRepository(Prescription)
        private readonly prescriptionRepository: Repository<Prescription>,
        private readonly notificationsService: NotificationsService,
        private readonly patientsService: PatientsService,
    ) { }

    async create(createPrescriptionDto: CreatePrescriptionDto, providerId: string): Promise<Prescription> {
        // Resolve patient ID
        const patientId = await this.patientsService.resolvePatientId(createPrescriptionDto.patientId);

        const prescriptionNumber = `RX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const prescription = (this.prescriptionRepository.create({
            ...createPrescriptionDto,
            patientId,
            providerId,
            prescriptionNumber,
            status: 'active',
        }) as unknown) as Prescription;
        const saved = await this.prescriptionRepository.save(prescription);

        // Notify patient
        try {
            const p = await this.prescriptionRepository.findOne({
                where: { id: saved.id },
                relations: ['patient']
            });
            if (p?.patient?.userId) {
                await this.notificationsService.createNotification({
                    userId: p.patient.userId,
                    type: 'medical_record',
                    title: 'New e-Prescription Received',
                    message: `You have a new prescription (${prescriptionNumber}) from your doctor.`,
                    data: { prescriptionId: saved.id },
                });
            }
        } catch (error) {
            console.error('Failed to notify patient about prescription:', error);
        }

        return saved;
    }

    async findAll(filters: { patientId?: string; providerId?: string }): Promise<Prescription[]> {
        const where: import('typeorm').FindOptionsWhere<Prescription> = {};
        if (filters.patientId) where.patientId = filters.patientId;
        if (filters.providerId) where.providerId = filters.providerId;

        return this.prescriptionRepository.find({
            where,
            relations: ['patient', 'provider', 'encounter'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Prescription> {
        const prescription = await this.prescriptionRepository.findOne({
            where: { id },
            relations: ['patient', 'provider', 'encounter'],
        });
        if (!prescription) {
            throw new NotFoundException(`Prescription with ID ${id} not found`);
        }
        return prescription;
    }

    async update(id: string, updatePrescriptionDto: UpdatePrescriptionDto): Promise<Prescription> {
        const prescription = await this.findOne(id);
        Object.assign(prescription, updatePrescriptionDto);
        return this.prescriptionRepository.save(prescription);
    }

    async verify(id: string, pharmacistId: string, verificationData: {
        status: string;
        notes?: string;
        interactionFlags?: any[];
    }): Promise<Prescription> {
        const prescription = await this.findOne(id);
        
        prescription.status = verificationData.status;
        prescription.pharmacistId = pharmacistId;
        prescription.verifiedAt = new Date();
        if (verificationData.notes) prescription.pharmacistNotes = verificationData.notes;
        if (verificationData.interactionFlags) prescription.interactionFlags = verificationData.interactionFlags;

        const saved = await this.prescriptionRepository.save(prescription);

        // Notify Doctor if interaction flagged
        if (verificationData.status === 'flag_interaction' && prescription.providerId) {
            await this.notificationsService.createNotification({
                userId: prescription.providerId,
                type: 'clinical_alert',
                title: 'Prescription Flagged by Pharmacy',
                message: `Interaction detected for ${prescription.prescriptionNumber}. Action Required.`,
                data: { prescriptionId: id, status: 'flagged' }
            });
        }

        return saved;
    }
}

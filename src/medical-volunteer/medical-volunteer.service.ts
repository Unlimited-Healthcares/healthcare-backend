import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalVolunteerSubmission } from './entities/medical-volunteer-submission.entity';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditLogService } from '../audit/audit-log.service';

@Injectable()
export class MedicalVolunteerService {
    private readonly logger = new Logger(MedicalVolunteerService.name);

    constructor(
        @InjectRepository(MedicalVolunteerSubmission)
        private submissionRepository: Repository<MedicalVolunteerSubmission>,
        private usersService: UsersService,
        private notificationsService: NotificationsService,
        private auditLogService: AuditLogService,
    ) { }

    async submitVerification(userId: string, data: {
        professionalRole: string;
        specialization: string;
        practiceNumber: string;
        country: string;
        professionalBody: string;
        licenseFilePath: string;
        verificationLink?: string;
        issueDate?: string | Date;
        expiryDate?: string | Date;
        additionalDocFilePath?: string;
    }): Promise<MedicalVolunteerSubmission> {
        // Check if user already has a pending submission
        const existing = await this.submissionRepository.findOne({
            where: { userId, status: 'PENDING' }
        });

        if (existing) {
            throw new BadRequestException('You already have a pending verification request.');
        }

        const submission = this.submissionRepository.create({
            userId,
            ...data,
            status: 'PENDING',
        });

        const saved = await this.submissionRepository.save(submission);

        // Notify admins
        await this.notificationsService.broadcast({
            title: 'New Medical Volunteer Verification',
            message: `A new verification request has been submitted by user ${userId}.`,
            type: 'system',
            isUrgent: false,
            data: { submissionId: saved.id }
        }, { roles: ['admin'] });

        await this.auditLogService.log({
            action: 'SUBMIT_MEDICAL_VERIFICATION',
            entityType: 'MedicalVolunteerSubmission',
            entityId: saved.id,
            userId,
            details: { professionalRole: data.professionalRole, practiceNumber: data.practiceNumber },
        });

        return saved;
    }

    async getSubmissionByUserId(userId: string): Promise<MedicalVolunteerSubmission | null> {
        return this.submissionRepository.findOne({
            where: { userId },
            order: { submittedAt: 'DESC' }
        });
    }

    async getAllSubmissions(filters: { status?: 'PENDING' | 'APPROVED' | 'REJECTED' } = {}): Promise<MedicalVolunteerSubmission[]> {
        return this.submissionRepository.find({
            where: filters,
            relations: ['user'],
            order: { submittedAt: 'DESC' }
        });
    }

    async getSubmissionById(id: string): Promise<MedicalVolunteerSubmission> {
        const submission = await this.submissionRepository.findOne({
            where: { id },
            relations: ['user']
        });

        if (!submission) {
            throw new NotFoundException('Submission not found');
        }

        return submission;
    }

    async reviewSubmission(id: string, adminId: string, status: 'APPROVED' | 'REJECTED', notes?: string): Promise<MedicalVolunteerSubmission> {
        const submission = await this.getSubmissionById(id);

        if (submission.status !== 'PENDING') {
            throw new BadRequestException('This submission has already been reviewed.');
        }

        submission.status = status;
        submission.reviewedBy = adminId;
        submission.reviewedAt = new Date();
        submission.reviewNotes = notes;

        const updated = await this.submissionRepository.save(submission);

        // If approved, update user role/status
        if (status === 'APPROVED') {
            await this.usersService.approveProfessionalVerification(
                submission.userId,
                submission.expiryDate ? new Date(submission.expiryDate) : undefined
            );
            this.logger.log(`User ${submission.userId} professional status set to APPROVED via volunteer review`);
        }

        // Notify user
        await this.notificationsService.createNotification({
            userId: submission.userId,
            title: `Medical Verification ${status}`,
            message: status === 'APPROVED'
                ? 'Your medical professional verification has been approved. Welcome to the team!'
                : `Your verification request was rejected. Reason: ${notes || 'Information provided was insufficient.'}`,
            type: 'system',
            isUrgent: true,
            data: { status, notes }
        });

        await this.auditLogService.log({
            action: 'REVIEW_MEDICAL_VERIFICATION',
            entityType: 'MedicalVolunteerSubmission',
            entityId: id,
            userId: adminId,
            details: { status, userId: submission.userId },
        });

        return updated;
    }
}

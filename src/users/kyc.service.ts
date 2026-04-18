import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycSubmission } from './entities/kyc-submission.entity';
import { User } from './entities/user.entity';
import { SubmitKycDto } from './dto/kyc.dto';
import { UploadsService } from '../uploads/uploads.service';

@Injectable()
export class KycService {
    private readonly logger = new Logger(KycService.name);

    constructor(
        @InjectRepository(KycSubmission)
        private kycRepository: Repository<KycSubmission>,

        @InjectRepository(User)
        private usersRepository: Repository<User>,

        private readonly uploadsService: UploadsService,
    ) { }

    /**
     * Submit a new KYC verification request
     */
    async submitKyc(
        userId: string,
        dto: SubmitKycDto,
        idDocFile?: Express.Multer.File,
        selfieFile?: Express.Multer.File,
    ): Promise<KycSubmission> {
        this.logger.log(`KYC submission started for user: ${userId}`);

        // Find the user
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException(`User ${userId} not found`);
        }

        // Check if user already has a pending submission
        const existing = await this.kycRepository.findOne({
            where: { userId, status: 'PENDING' },
        });
        if (existing) {
            throw new BadRequestException('You already have a pending KYC submission.');
        }

        let idDocUrl = dto.idDocumentUrl;
        let selfieUrl = dto.selfieUrl;

        if (idDocFile) {
            idDocUrl = await this.uploadsService.uploadIdentityDocument(idDocFile, userId);
        }

        if (selfieFile) {
            // Selfies also go to identity bucket
            selfieUrl = await this.uploadsService.uploadIdentityDocument(selfieFile, userId);
        }

        if (!idDocUrl) {
            throw new BadRequestException('ID document is required (file or URL)');
        }

        // Create KYC submission record
        const submission = this.kycRepository.create({
            userId,
            fullName: dto.fullName,
            idDocType: dto.idDocType,
            idDocNumber: dto.idDocNumber,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            zipCode: dto.zipCode,
            idDocFilePath: idDocUrl,
            selfieFilePath: selfieUrl || null,
            status: 'PENDING',
        });

        const saved = await this.kycRepository.save(submission);

        // Update user's KYC status
        user.kycStatus = 'PENDING';
        await this.usersRepository.save(user);

        this.logger.log(`KYC submitted successfully: ${saved.id} for user: ${userId}`);
        return saved;
    }

    /**
     * Get all KYC submissions (admin use)
     */
    async getAllSubmissions(status?: string): Promise<KycSubmission[]> {
        const where: Record<string, unknown> = {};
        if (status) {
            where.status = status;
        }
        return this.kycRepository.find({
            where,
            relations: ['user'],
            order: { submittedAt: 'DESC' },
        });
    }

    /**
     * Get a single KYC submission by ID
     */
    async getSubmissionById(id: string): Promise<KycSubmission> {
        const submission = await this.kycRepository.findOne({
            where: { id },
            relations: ['user'],
        });
        if (!submission) {
            throw new NotFoundException(`KYC submission ${id} not found`);
        }
        return submission;
    }

    /**
     * Get KYC submissions for a specific user
     */
    async getSubmissionsByUserId(userId: string): Promise<KycSubmission[]> {
        return this.kycRepository.find({
            where: { userId },
            order: { submittedAt: 'DESC' },
        });
    }

    /**
     * Review (approve or reject) a KYC submission
     */
    async reviewSubmission(
        submissionId: string,
        action: 'APPROVED' | 'REJECTED',
        reviewerId: string,
        notes?: string,
    ): Promise<KycSubmission> {
        const submission = await this.getSubmissionById(submissionId);

        if (submission.status !== 'PENDING') {
            throw new BadRequestException(`This submission has already been ${submission.status.toLowerCase()}.`);
        }

        // Update the submission
        submission.status = action;
        submission.reviewedBy = reviewerId;
        submission.reviewedAt = new Date();
        submission.reviewNotes = notes || null;
        await this.kycRepository.save(submission);

        // Update the user's KYC status
        const user = await this.usersRepository.findOne({ where: { id: submission.userId } });
        if (user) {
            user.kycStatus = action;
            await this.usersRepository.save(user);
        }

        this.logger.log(`KYC submission ${submissionId} ${action} by ${reviewerId}`);
        return submission;
    }

    /**
     * Get KYC stats for admin dashboard
     */
    async getStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }> {
        const [pending, approved, rejected, total] = await Promise.all([
            this.kycRepository.count({ where: { status: 'PENDING' } }),
            this.kycRepository.count({ where: { status: 'APPROVED' } }),
            this.kycRepository.count({ where: { status: 'REJECTED' } }),
            this.kycRepository.count(),
        ]);
        return { pending, approved, rejected, total };
    }
}

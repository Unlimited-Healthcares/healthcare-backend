import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CenterVerificationRequest, VerificationStatus } from '../entities/center-verification-request.entity';
import { CreateCenterVerificationRequestDto, UpdateCenterVerificationRequestDto, CenterVerificationFiltersDto } from '../dto/center-verification.dto';
import { AdminAuditLogService } from './admin-audit-log.service';
import { PaginatedApiResponse } from '../../types/api.types';

@Injectable()
export class CenterVerificationService {
  constructor(
    @InjectRepository(CenterVerificationRequest)
    private verificationRepository: Repository<CenterVerificationRequest>,
    private auditLogService: AdminAuditLogService,
  ) {}

  async createVerificationRequest(
    createDto: CreateCenterVerificationRequestDto,
    requestedBy: string,
  ): Promise<CenterVerificationRequest> {
    const request = this.verificationRepository.create({
      ...createDto,
      requestedBy,
      submittedAt: new Date(),
    });

    const savedRequest = await this.verificationRepository.save(request);

    await this.auditLogService.logAction({
      adminUserId: requestedBy,
      actionType: 'center_verification_request_created',
      targetType: 'center',
      targetId: createDto.centerId,
      actionDescription: `Created verification request for center ${createDto.centerId}`,
      newValues: JSON.parse(JSON.stringify(savedRequest)),
    });

    return savedRequest;
  }

  async getVerificationRequests(filters: CenterVerificationFiltersDto): Promise<PaginatedApiResponse<CenterVerificationRequest>> {
    const { page = 1, limit = 10, status, requestType, centerId } = filters;
    
    const queryBuilder = this.verificationRepository.createQueryBuilder('request');

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }
    if (requestType) {
      queryBuilder.andWhere('request.requestType = :requestType', { requestType });
    }
    if (centerId) {
      queryBuilder.andWhere('request.centerId = :centerId', { centerId });
    }

    queryBuilder
      .orderBy('request.submittedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: requests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getVerificationRequestById(id: string): Promise<CenterVerificationRequest> {
    const request = await this.verificationRepository.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('Verification request not found');
    }
    return request;
  }

  async updateVerificationRequest(
    id: string,
    updateDto: UpdateCenterVerificationRequestDto,
    reviewedBy: string,
  ): Promise<CenterVerificationRequest> {
    const request = await this.getVerificationRequestById(id);
    const oldValues = { ...request };

    Object.assign(request, updateDto);
    request.reviewedBy = reviewedBy;
    request.reviewedAt = new Date();

    const updatedRequest = await this.verificationRepository.save(request);

    await this.auditLogService.logAction({
      adminUserId: reviewedBy,
      actionType: 'center_verification_request_updated',
      targetType: 'center',
      targetId: request.centerId,
      actionDescription: `Updated verification request for center ${request.centerId}`,
      oldValues: JSON.parse(JSON.stringify(oldValues)),
      newValues: JSON.parse(JSON.stringify(updatedRequest)),
    });

    return updatedRequest;
  }

  async approveVerificationRequest(id: string, reviewedBy: string): Promise<CenterVerificationRequest> {
    return this.updateVerificationRequest(
      id,
      { 
        status: VerificationStatus.APPROVED,
        reviewerNotes: 'Verification approved'
      },
      reviewedBy
    );
  }

  async rejectVerificationRequest(
    id: string, 
    rejectionReason: string, 
    reviewedBy: string
  ): Promise<CenterVerificationRequest> {
    return this.updateVerificationRequest(
      id,
      { 
        status: VerificationStatus.REJECTED,
        rejectionReason,
        reviewerNotes: 'Verification rejected'
      },
      reviewedBy
    );
  }

  async getCenterVerificationHistory(centerId: string): Promise<CenterVerificationRequest[]> {
    return this.verificationRepository.find({
      where: { centerId },
      order: { submittedAt: 'DESC' },
    });
  }
}

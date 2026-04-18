import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRegistrationRequest, AdminRequestStatus } from '../entities/admin-registration-request.entity';
import { AdminRegistrationRequestDto, AdminRegistrationApprovalDto } from '../../auth/dto/admin-registration.dto';
import { UsersService } from '../../users/users.service';
import { UserActivityLogService } from './user-activity-log.service';
import { AuditService } from '../../audit/audit.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';

@Injectable()
export class AdminRegistrationService {
  private readonly logger = new Logger(AdminRegistrationService.name);

  constructor(
    @InjectRepository(AdminRegistrationRequest)
    private readonly adminRequestRepository: Repository<AdminRegistrationRequest>,
    private readonly usersService: UsersService,
    private readonly userActivityLogService: UserActivityLogService,
    private readonly auditService: AuditService,
  ) {}

  async createAdminRequest(
    requestDto: AdminRegistrationRequestDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AdminRegistrationRequest> {
    // Check if email already exists in users or pending requests
    const existingUser = await this.usersService.findByEmail(requestDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const existingRequest = await this.adminRequestRepository.findOne({
      where: { email: requestDto.email, status: AdminRequestStatus.PENDING }
    });
    if (existingRequest) {
      throw new BadRequestException('Admin request already pending for this email');
    }

    // Create the admin registration request (without storing password)
    const adminRequest = this.adminRequestRepository.create({
      email: requestDto.email,
      name: requestDto.name,
      requestedRoles: requestDto.roles,
      phone: requestDto.phone,
      reason: requestDto.reason,
      intendedRole: requestDto.intendedRole,
      status: AdminRequestStatus.PENDING,
      ipAddress,
      userAgent,
    });

    const savedRequest = await this.adminRequestRepository.save(adminRequest);

    // Log the activity
    await this.auditService.logActivity(
      'system',
      'AdminRegistrationRequest',
      'ADMIN_REQUEST_CREATED',
      'Admin registration request created',
      { 
        requestId: savedRequest.id,
        email: savedRequest.email,
        intendedRole: savedRequest.intendedRole 
      },
      ipAddress,
      userAgent
    );

    this.logger.log(`Admin registration request created for ${requestDto.email}`);

    return savedRequest;
  }

  async getAllRequests(status?: AdminRequestStatus): Promise<AdminRegistrationRequest[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.adminRequestRepository.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['reviewer'],
    });
  }

  async getRequestById(id: string): Promise<AdminRegistrationRequest> {
    const request = await this.adminRequestRepository.findOne({
      where: { id },
      relations: ['reviewer'],
    });

    if (!request) {
      throw new NotFoundException('Admin registration request not found');
    }

    return request;
  }

  async approveRequest(
    requestId: string,
    approvalDto: AdminRegistrationApprovalDto,
    reviewerId: string,
  ): Promise<AdminRegistrationRequest> {
    const request = await this.getRequestById(requestId);

    if (request.status !== AdminRequestStatus.PENDING) {
      throw new BadRequestException('Request has already been processed');
    }

    if (approvalDto.decision === 'approved') {
      // For admin approval, we need a password to be provided
      if (!approvalDto.password) {
        throw new BadRequestException('Password is required when approving admin requests');
      }

      // Create the admin user using CreateUserDto structure
      const createUserDto: CreateUserDto = {
        email: request.email,
        password: approvalDto.password,
        roles: approvalDto.finalRoles || request.requestedRoles,
        profile: {
          displayName: request.name,
          phone: request.phone,
        },
      };

      try {
        const newAdmin = await this.usersService.create(createUserDto);

        // Update request status
        request.status = AdminRequestStatus.APPROVED;
        request.decisionReason = approvalDto.reason;
        request.finalRoles = approvalDto.finalRoles || request.requestedRoles;
        request.reviewedBy = reviewerId;
        request.reviewedAt = new Date();

        const updatedRequest = await this.adminRequestRepository.save(request);

        // Log the approval and user creation
        await this.auditService.logActivity(
          reviewerId,
          'AdminRegistrationRequest',
          'ADMIN_REQUEST_APPROVED',
          'Admin registration request approved',
          { 
            requestId: request.id,
            newAdminId: newAdmin.id,
            email: newAdmin.email 
          }
        );

        await this.userActivityLogService.logActivity({
          userId: newAdmin.id,
          activityType: 'admin_creation',
          activityDescription: `Admin user created by ${reviewerId}`,
        });

        this.logger.log(`Admin registration request approved for ${request.email}`);

        return updatedRequest;
      } catch (error) {
        this.logger.error(`Failed to create admin user: ${error.message}`);
        throw new BadRequestException('Failed to create admin user');
      }
    } else {
      // Reject the request
      request.status = AdminRequestStatus.REJECTED;
      request.decisionReason = approvalDto.reason;
      request.reviewedBy = reviewerId;
      request.reviewedAt = new Date();

      const updatedRequest = await this.adminRequestRepository.save(request);

      // Log the rejection
      await this.auditService.logActivity(
        reviewerId,
        'AdminRegistrationRequest',
        'ADMIN_REQUEST_REJECTED',
        'Admin registration request rejected',
        { 
          requestId: request.id,
          email: request.email,
          reason: approvalDto.reason 
        }
      );

      this.logger.log(`Admin registration request rejected for ${request.email}`);

      return updatedRequest;
    }
  }

  async deleteRequest(requestId: string, reviewerId: string): Promise<void> {
    const request = await this.getRequestById(requestId);

    if (request.status !== AdminRequestStatus.PENDING) {
      throw new BadRequestException('Cannot delete processed request');
    }

    await this.adminRequestRepository.remove(request);

    // Log the deletion
    await this.auditService.logActivity(
      reviewerId,
      'AdminRegistrationRequest',
      'ADMIN_REQUEST_DELETED',
      'Admin registration request deleted',
      { 
        requestId: request.id,
        email: request.email 
      }
    );

    this.logger.log(`Admin registration request deleted for ${request.email}`);
  }

  async getPendingRequestsCount(): Promise<number> {
    return this.adminRequestRepository.count({
      where: { status: AdminRequestStatus.PENDING }
    });
  }
}

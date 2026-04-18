
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodDonationRequest, RequestStatus, RequestPriority } from '../entities/blood-donation-request.entity';
import { CreateBloodDonationRequestDto } from '../dto/create-blood-donation-request.dto';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class BloodDonationRequestsService {
  private readonly logger = new Logger(BloodDonationRequestsService.name);

  constructor(
    @InjectRepository(BloodDonationRequest)
    private requestRepository: Repository<BloodDonationRequest>,
    private notificationsService: NotificationsService,
  ) { }

  async create(createRequestDto: CreateBloodDonationRequestDto): Promise<BloodDonationRequest> {
    // Generate unique request number
    const requestNumber = await this.generateRequestNumber();

    const request = this.requestRepository.create({
      ...createRequestDto,
      requestNumber,
      neededBy: new Date(createRequestDto.neededBy),
    });

    const savedRequest = await this.requestRepository.save(request);

    // Send notifications for urgent requests
    if (request.priority === RequestPriority.CRITICAL || request.priority === RequestPriority.HIGH) {
      await this.sendUrgentRequestNotifications(savedRequest);
    }

    this.logger.log(`New blood donation request created: ${requestNumber}`);
    return savedRequest;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: RequestStatus,
    priority?: RequestPriority,
    bloodType?: string,
    centerId?: string,
  ) {
    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requestingCenter', 'center')
      .leftJoinAndSelect('request.approver', 'approver')
      .orderBy('request.priority', 'DESC')
      .addOrderBy('request.neededBy', 'ASC');

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('request.priority = :priority', { priority });
    }

    if (bloodType) {
      queryBuilder.andWhere('request.bloodType = :bloodType', { bloodType });
    }

    if (centerId) {
      queryBuilder.andWhere('request.requestingCenterId = :centerId', { centerId });
    }

    const [requests, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: requests.map(r => this.maskSensitiveData(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<BloodDonationRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['requestingCenter', 'approver', 'donations'],
    });

    if (!request) {
      throw new NotFoundException('Blood donation request not found');
    }

    return this.maskSensitiveData(request);
  }

  private maskSensitiveData(request: BloodDonationRequest): BloodDonationRequest {
    // In a real app, we'd check the user's role and center here.
    // For now, we always mask the patient name to ensure confidentiality
    // unless it's the center that created it (would need request context).
    // As a strict privacy measure, we'll provide a masked version.
    return {
      ...request,
      patientName: request.patientName ? `${request.patientName.split(' ')[0]} ***` : 'Private Patient',
      medicalCondition: 'Clinical Data Protected',
      contactPhone: '***-***-****',
    };
  }

  async approveRequest(id: string, approvedBy: string): Promise<BloodDonationRequest> {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be approved');
    }

    request.status = RequestStatus.APPROVED;
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();

    const updatedRequest = await this.requestRepository.save(request);

    // Send notification about approval
    await this.notificationsService.createNotification({
      title: 'Blood Request Approved',
      message: `Blood donation request ${request.requestNumber} has been approved`,
      type: 'blood_request_approved',
      relatedId: request.id,
      relatedType: 'blood_donation_request',
    });

    this.logger.log(`Blood request ${request.requestNumber} approved by user ${approvedBy}`);
    return updatedRequest;
  }

  async fulfillRequest(id: string, unitsFulfilled: number): Promise<BloodDonationRequest> {
    const request = await this.findOne(id);

    if (request.status !== RequestStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be fulfilled');
    }

    request.unitsFulfilled += unitsFulfilled;

    if (request.unitsFulfilled >= request.unitsNeeded) {
      request.status = RequestStatus.FULFILLED;
      request.fulfilledAt = new Date();
    }

    const updatedRequest = await this.requestRepository.save(request);

    // Send notification about fulfillment
    if (request.status === RequestStatus.FULFILLED) {
      await this.notificationsService.createNotification({
        title: 'Blood Request Fulfilled',
        message: `Blood donation request ${request.requestNumber} has been completely fulfilled`,
        type: 'blood_request_fulfilled',
        relatedId: request.id,
        relatedType: 'blood_donation_request',
      });
    }

    this.logger.log(`Blood request ${request.requestNumber} updated: ${request.unitsFulfilled}/${request.unitsNeeded} units fulfilled`);
    return updatedRequest;
  }

  async cancelRequest(id: string, reason?: string): Promise<BloodDonationRequest> {
    const request = await this.findOne(id);

    if (request.status === RequestStatus.FULFILLED) {
      throw new BadRequestException('Cannot cancel a fulfilled request');
    }

    request.status = RequestStatus.CANCELLED;
    if (reason) {
      request.notes = `Cancelled: ${reason}`;
    }

    return await this.requestRepository.save(request);
  }

  async getUrgentRequests(): Promise<BloodDonationRequest[]> {
    const urgent = new Date();
    urgent.setHours(urgent.getHours() + 24); // Next 24 hours

    return await this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.requestingCenter', 'center')
      .where('request.status IN (:...statuses)', { statuses: [RequestStatus.PENDING, RequestStatus.APPROVED] })
      .andWhere('request.priority IN (:...priorities)', { priorities: [RequestPriority.HIGH, RequestPriority.CRITICAL] })
      .andWhere('request.neededBy <= :urgent', { urgent })
      .orderBy('request.priority', 'DESC')
      .addOrderBy('request.neededBy', 'ASC')
      .getMany();
  }

  private async generateRequestNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const prefix = `BR${year}${month}`;

    const lastRequest = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.requestNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('request.requestNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastRequest) {
      const lastSequence = parseInt(lastRequest.requestNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`;
  }

  private async sendUrgentRequestNotifications(request: BloodDonationRequest): Promise<void> {
    try {
      // Send notification to all blood bank administrators
      await this.notificationsService.createNotification({
        title: 'URGENT: Blood Donation Request',
        message: `${request.priority.toUpperCase()} priority request for ${request.unitsNeeded} unit(s) of ${request.bloodType} blood needed by ${request.neededBy.toLocaleDateString()}`,
        type: 'urgent_blood_request',
        relatedId: request.id,
        relatedType: 'blood_donation_request',
        isUrgent: true,
      });

      this.logger.log(`Urgent notifications sent for request ${request.requestNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send urgent notifications for request ${request.requestNumber}:`, error);
    }
  }
}

import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserRequest } from './entities/user-request.entity';
import { User } from '../users/entities/user.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { GetRequestsDto } from './dto/get-requests.dto';
import { RequestResponseDto, SafeUserDto } from './dto/request-response.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { CentersService } from '../centers/centers.service';
import { PatientsService } from '../patients/patients.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { CreateAppointmentDto } from '../appointments/dto/create-appointment.dto';
import { UsersService } from '../users/users.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(UserRequest)
    private readonly requestRepository: Repository<UserRequest>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly notificationsService: NotificationsService,
    private readonly centersService: CentersService,
    private readonly patientsService: PatientsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly dataSource: DataSource,
  ) { }

  /**
   * Safely transform user entity to SafeUserDto, excluding sensitive fields
   */
  private transformToSafeUser(user: User): SafeUserDto {
    if (!user) {
      this.logger.warn('transformToSafeUser called with undefined user');
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile ? {
        id: user.profile.id,
        userId: user.profile.userId,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
        dateOfBirth: user.profile.dateOfBirth,
        gender: user.profile.gender,
        address: user.profile.address,
        specialization: user.profile.specialization,
        practiceNumber: user.profile.practiceNumber,
        experience: user.profile.experience,
        qualifications: user.profile.qualifications,
        location: user.profile.location,
        availability: user.profile.availability,
        privacySettings: user.profile.privacySettings,
        professionalPractice: user.profile.professionalPractice,
        businessRegistration: user.profile.businessRegistration,
        createdAt: user.profile.createdAt,
        updatedAt: user.profile.updatedAt,
      } : undefined,
    };
  }

  /**
   * Transform request entity to safe response DTO
   */
  private transformToRequestResponse(request: UserRequest): RequestResponseDto {
    return {
      id: request.id,
      senderId: request.senderId,
      recipientId: request.recipientId,
      requestType: request.requestType,
      status: request.status,
      message: request.message,
      metadata: request.metadata,
      createdAt: request.createdAt,
      respondedAt: request.respondedAt,
      responseMessage: request.responseMessage,
      createdBy: request.createdBy,
      updatedAt: request.updatedAt,
      sender: this.transformToSafeUser(request.sender),
      recipient: request.recipient ? this.transformToSafeUser(request.recipient) : undefined,
    };
  }

  async createRequest(createRequestDto: CreateRequestDto & { senderId: string }): Promise<UserRequest> {
    try {
      this.logger.debug(`Creating request: ${createRequestDto.requestType} from ${createRequestDto.senderId} to ${createRequestDto.recipientId}`);

      // Fetch sender name for better notifications
      const senderProfile = await this.usersService.getProfileByUserId(createRequestDto.senderId);
      const senderName = senderProfile?.displayName ||
        (senderProfile?.firstName ? `${senderProfile.firstName} ${senderProfile.lastName || ''}`.trim() : null) ||
        'A user';
      const formattedRequestType = createRequestDto.requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      // Check if a similar request already exists
      const existingRequest = await this.requestRepository.findOne({
        where: {
          senderId: createRequestDto.senderId,
          recipientId: createRequestDto.recipientId,
          requestType: createRequestDto.requestType,
          status: 'pending'
        }
      });

      if (existingRequest) {
        throw new ConflictException('A similar request already exists');
      }

      // Minimal create-time validations for certain request types to catch issues early

      // Auto-populate patientId for patient_request if missing
      const metadata = createRequestDto.metadata as Record<string, unknown> | undefined;
      if (createRequestDto.requestType === 'patient_request' && !(metadata?.patientId)) {
        try {
          this.logger.debug(`Attempting to auto-resolve patientId for patient_request`);

          // 1. Try to find patient record for the sender
          let patient = await this.patientsService.findByUserId(createRequestDto.senderId).catch(() => null);

          // 2. If no patient record found for sender, check if sender has patient role and create it
          if (!patient) {
            const sender = await this.usersService.findById(createRequestDto.senderId).catch(() => null);
            if (sender && sender.roles && sender.roles.includes('patient')) {
              this.logger.debug(`Creating missing patient record for sender ${createRequestDto.senderId}`);
              patient = await this.patientsService.create({ userId: createRequestDto.senderId }).catch(() => null);
            }
          }

          // 3. If still no patient record, try to find for the recipient (e.g. provider adding a patient)
          if (!patient) {
            patient = await this.patientsService.findByUserId(createRequestDto.recipientId).catch(() => null);

            // 4. If no patient record for recipient, check if recipient has patient role and create it
            if (!patient) {
              const recipient = await this.usersService.findById(createRequestDto.recipientId).catch(() => null);
              if (recipient && recipient.roles && recipient.roles.includes('patient')) {
                this.logger.debug(`Creating missing patient record for recipient ${createRequestDto.recipientId}`);
                patient = await this.patientsService.create({ userId: createRequestDto.recipientId }).catch(() => null);
              }
            }
          }

          if (patient) {
            createRequestDto.metadata = {
              ...(createRequestDto.metadata || {}),
              patientId: patient.id
            };
            this.logger.debug(`Successfully resolved patientId ${patient.id} for patient_request`);
          } else {
            this.logger.warn(`Could not resolve patientId for patient_request between ${createRequestDto.senderId} and ${createRequestDto.recipientId}`);
          }
        } catch (error) {
          this.logger.error(`Unexpected error during patientId resolution: ${error.message}`);
        }
      }

      this.validateRequestOnCreate(createRequestDto);

      // Determine payment status based on recipient settings
      let paymentStatus: 'not_required' | 'pending' | 'paid' | 'verified' | 'failed' = 'not_required';
      const paymentInfo = createRequestDto.metadata?.paymentInfo as Record<string, unknown> | undefined;
      const paymentMethodUsed = paymentInfo?.method as string | undefined;
      const paymentReference = paymentInfo?.reference as string | undefined;

      try {
        const recipientProfile = await this.usersService.getProfileByUserId(createRequestDto.recipientId);
        const recipientCenters = await this.centersService.findByUserId(createRequestDto.recipientId);
        const recipientCenter = recipientCenters && recipientCenters.length > 0 ? recipientCenters[0] : null;

        const paymentSettings = recipientCenter?.paymentSettings || recipientProfile?.paymentSettings;

        if (paymentSettings?.requireUpfrontPayment && createRequestDto.requestType === 'consultation_request') {
          paymentStatus = 'pending';

          // If transaction already provided (e.g. online payment completed on frontend)
          if (paymentInfo?.status === 'success') {
            paymentStatus = 'paid';
          }

          // --- WALLET PAYMENT LOGIC ---
          if (paymentMethodUsed === 'wallet' && paymentStatus !== 'paid') {
            const amount = Number(paymentInfo?.amount) || 0;
            if (amount > 0) {
              try {
                this.logger.debug(`Processing wallet payment for request: ${amount}`);
                await this.walletsService.processServicePayment(
                  createRequestDto.senderId,
                  createRequestDto.recipientId,
                  amount,
                  `Upfront payment for ${createRequestDto.requestType}`,
                  'NEW_REQUEST' // Temporary ref until saved
                );
                paymentStatus = 'paid';
              } catch (error) {
                this.logger.error(`Wallet payment failed for request: ${error.message}`);
                throw new BadRequestException(`Insufficient wallet balance or payment failed: ${error.message}`);
              }
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Failed to fetch recipient payment settings for ${createRequestDto.recipientId}: ${err.message}`);
      }

      const requestData: Partial<UserRequest> = {
        senderId: createRequestDto.senderId,
        recipientId: createRequestDto.recipientId,
        requestType: createRequestDto.requestType,
        message: createRequestDto.message,
        metadata: createRequestDto.metadata,
        createdBy: createRequestDto.senderId,
        paymentStatus,
        paymentReference,
        paymentMethodUsed,
      };

      const request = this.requestRepository.create(requestData);

      const savedRequest = await this.requestRepository.save(request);

      // BROADCAST LOGIC: Notify all relevant professionals for service interests
      if (createRequestDto.requestType === 'service_interest') {
        const specialty = createRequestDto.metadata?.specialty as string;
        if (specialty) {
          this.logger.debug(`Broadcasting service interest to all ${specialty} professionals`);

          // Find all doctors/nurses with this specialization
          const professionals = await this.usersRepository.createQueryBuilder('user')
            .leftJoin('user.profile', 'profile')
            .where('profile.specialization = :specialty', { specialty })
            .andWhere('user.roles LIKE :role', { role: '%doctor%' })
            .getMany();

          if (professionals.length > 0) {
            await this.notificationsService.broadcast({
              type: 'request_received',
              title: 'New Patient Service Interest',
              message: `${senderName} has indicated interest in ${specialty} services.`,
              data: { requestId: savedRequest.id, specialty, senderId: createRequestDto.senderId }
            }, { userIds: professionals.map(p => p.id) });

            this.logger.debug(`Notified ${professionals.length} professionals about service interest ${savedRequest.id}`);
          }
        }
      }

      // Only notify recipient if payment is not pending AND it's not a broadcast
      if (paymentStatus !== 'pending' && createRequestDto.recipientId) {
        let title = `New ${formattedRequestType}`;
        let message = `${senderName} has sent you a ${formattedRequestType.toLowerCase()} request.`;

        if (createRequestDto.requestType === 'appointment_invitation') {
          title = 'Appointment Invitation from Specialist';
          message = `Dr. ${senderName} has invited you to book a consultation. Please check your dashboard to schedule an appointment.`;
        }

        const recipientProfile = await this.usersService.getProfileByUserId(createRequestDto.recipientId);
        const recipientName = recipientProfile?.displayName ||
          (recipientProfile?.firstName ? `${recipientProfile.firstName} ${recipientProfile.lastName || ''}`.trim() : 'Healthcare Professional');

        await this.notificationsService.createNotification({
          userId: createRequestDto.recipientId,
          type: 'request_received',
          title,
          message,
          data: {
            requestId: savedRequest.id,
            senderId: createRequestDto.senderId,
            senderName,
            recipientName,
            requestType: createRequestDto.requestType,
            message: createRequestDto.message,
            metadata: createRequestDto.metadata
          }
        });
      } else if (paymentStatus === 'pending') {
        this.logger.debug(`Request ${savedRequest.id} created but awaiting payment. Notification suppressed.`);
      }

      this.logger.debug(`Request created successfully: ${savedRequest.id}`);
      return savedRequest;
    } catch (error) {
      this.logger.error(`Error creating request: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Update payment status for a request. 
   * If payment is verified/paid, notify the recipient if they weren't notified before.
   */
  async updatePaymentStatus(requestId: string, paymentStatus: 'paid' | 'verified' | 'failed', reference?: string): Promise<UserRequest> {
    const request = await this.requestRepository.findOne({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException(`Request ${requestId} not found`);
    }

    const wasPending = request.paymentStatus === 'pending';
    request.paymentStatus = paymentStatus;
    if (reference) request.paymentReference = reference;

    const updatedRequest = await this.requestRepository.save(request);

    // If it was pending and is now paid/verified, send the notification now
    if (wasPending && (paymentStatus === 'paid' || paymentStatus === 'verified')) {
      const senderProfile = await this.usersService.getProfileByUserId(request.senderId);
      const senderName = senderProfile?.displayName ||
        (senderProfile?.firstName ? `${senderProfile.firstName} ${senderProfile.lastName || ''}`.trim() : null) ||
        'A user';
      const formattedRequestType = request.requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

      await this.notificationsService.createNotification({
        userId: request.recipientId,
        type: 'request_received',
        title: `New ${formattedRequestType} (Payment Verified)`,
        message: `${senderName}'s ${formattedRequestType.toLowerCase()} request is now active after payment verification`,
        data: { requestId: request.id, senderId: request.senderId }
      });
    }

    return updatedRequest;
  }

  /**
   * Validate required inputs for request creation (lightweight, fail fast for known cases)
   */
  private validateRequestOnCreate(createRequestDto: CreateRequestDto & { senderId: string }): void {
    const missingFields: string[] = [];
    if (createRequestDto.requestType === 'job_application') {
      const hasCenterId = Boolean((createRequestDto.metadata as Record<string, unknown> | undefined)?.centerId);
      if (!hasCenterId) missingFields.push('metadata.centerId');
    }

    if (['care_task', 'transfer_patient', 'referral', 'patient_request', 'lab_order', 'pharmacy_transfer', 'radiology_order'].includes(createRequestDto.requestType)) {
      const hasPatientId = Boolean((createRequestDto.metadata as Record<string, unknown> | undefined)?.patientId);
      if (!hasPatientId) missingFields.push('metadata.patientId');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        error: 'Missing required fields for request creation',
        requestType: createRequestDto.requestType,
        missing: missingFields,
        message: `Cannot create ${createRequestDto.requestType} because required field(s) are missing: ${missingFields.join(', ')}`,
      });
    }
  }

  async getReceivedRequests(userId: string, filters: GetRequestsDto): Promise<{ requests: RequestResponseDto[]; total: number; page: number; hasMore: boolean }> {
    try {
      this.logger.debug(`Getting received requests for user: ${userId}`);

      const queryBuilder = this.requestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.sender', 'sender')
        .leftJoinAndSelect('sender.profile', 'senderProfile')
        .where('request.recipientId = :userId', { userId })
        .orWhere('(request.requestType = :interestType AND request.status = :pendingStatus AND request.metadata->>\'specialty\' = :userSpecialty)', {
          interestType: 'service_interest',
          pendingStatus: 'pending',
          userSpecialty: filters.specialty || ''
        })
        .orWhere('(request.requestType IN (:...orderTypes) AND request.status = :pendingStatus)', {
          orderTypes: ['lab_order', 'pharmacy_transfer', 'radiology_order'],
          pendingStatus: 'pending'
        });

      // If no specific payment status is requested, default to excluding 'pending'
      if (!filters.paymentStatus) {
        queryBuilder.andWhere('request.paymentStatus != :pendingStatus', { pendingStatus: 'pending' });
      } else {
        queryBuilder.andWhere('request.paymentStatus = :paymentStatus', { paymentStatus: filters.paymentStatus });
      }

      if (filters.status) {
        queryBuilder.andWhere('request.status = :status', { status: filters.status });
      }

      if (filters.type) {
        queryBuilder.andWhere('request.requestType = :type', { type: filters.type });
      }

      const total = await queryBuilder.getCount();

      const requests = await queryBuilder
        .orderBy('request.createdAt', 'DESC')
        .skip((filters.page - 1) * filters.limit)
        .take(filters.limit)
        .getMany();

      const hasMore = (filters.page * filters.limit) < total;

      this.logger.debug(`Found ${requests.length} received requests for user: ${userId}`);

      // Transform to safe DTOs to exclude sensitive data
      const safeRequests = requests.map(request => this.transformToRequestResponse(request));

      return {
        requests: safeRequests,
        total,
        page: filters.page,
        hasMore
      };
    } catch (error) {
      this.logger.error(`Error getting received requests: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSentRequests(userId: string, filters: GetRequestsDto): Promise<{ requests: RequestResponseDto[]; total: number; page: number; hasMore: boolean }> {
    try {
      this.logger.debug(`Getting sent requests for user: ${userId}`);

      const queryBuilder = this.requestRepository
        .createQueryBuilder('request')
        .leftJoinAndSelect('request.sender', 'sender')
        .leftJoinAndSelect('sender.profile', 'senderProfile')
        .leftJoinAndSelect('request.recipient', 'recipient')
        .leftJoinAndSelect('recipient.profile', 'recipientProfile')
        .where('request.senderId = :userId', { userId });

      if (filters.status) {
        queryBuilder.andWhere('request.status = :status', { status: filters.status });
      }

      if (filters.type) {
        queryBuilder.andWhere('request.requestType = :type', { type: filters.type });
      }

      const total = await queryBuilder.getCount();

      const requests = await queryBuilder
        .orderBy('request.createdAt', 'DESC')
        .skip((filters.page - 1) * filters.limit)
        .take(filters.limit)
        .getMany();

      const hasMore = (filters.page * filters.limit) < total;

      this.logger.debug(`Found ${requests.length} sent requests for user: ${userId}`);

      // Transform to safe DTOs to exclude sensitive data
      const safeRequests = requests.map(request => this.transformToRequestResponse(request));

      return {
        requests: safeRequests,
        total,
        page: filters.page,
        hasMore
      };
    } catch (error) {
      this.logger.error(`Error getting sent requests: ${error.message}`, error.stack);
      throw error;
    }
  }

  async respondToRequest(requestId: string, respondDto: RespondRequestDto, userId: string): Promise<UserRequest> {
    try {
      this.logger.debug(`Responding to request: ${requestId} with action: ${respondDto.action}`);

      // Fetch responder profile for better notifications
      const responderProfile = await this.usersService.getProfileByUserId(userId);
      const responderName = responderProfile?.displayName ||
        (responderProfile?.firstName ? `${responderProfile.firstName} ${responderProfile.lastName || ''}`.trim() : null) ||
        'A healthcare professional';
      const responderRole = responderProfile?.specialization || 'Clinical Professional';


      const request = await this.requestRepository.createQueryBuilder('request')
        .leftJoinAndSelect('request.sender', 'sender')
        .leftJoinAndSelect('request.recipient', 'recipient')
        .where('request.id = :id', { id: requestId })
        .andWhere('(request.recipientId = :userId OR (request.requestType = :interestType AND request.recipientId IS NULL))', {
          userId,
          interestType: 'service_interest'
        })
        .getOne();

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      if (request.status !== 'pending') {
        throw new ConflictException('Request has already been processed');
      }

      // 🛡️ SECURITY: Prevent responding to requests awaiting payment (Amazon/Alibaba model)
      if (request.paymentStatus === 'pending') {
        throw new BadRequestException('Cannot respond to request until upfront payment is verified/completed.');
      }

      // If approving, perform strict validation BEFORE mutating/saving
      if (respondDto.action === 'approve') {
        if (request.requestType === 'service_interest') {
          // Special case: Doctors "responding" to a broadcast interest actually 
          // send a NEW consultation_request to the patient.
          const newRequest = this.requestRepository.create({
            senderId: userId,
            recipientId: request.senderId,
            requestType: 'consultation_request',
            message: respondDto.message || `I am available for a ${request.metadata?.specialty} consultation.`,
            metadata: {
              ...(respondDto.metadata || {}),
              originalInterestId: request.id,
              specialty: request.metadata?.specialty
            },
            createdBy: userId,
            paymentStatus: 'not_required'
          });

          const savedNewRequest = await this.requestRepository.save(newRequest);

          await this.notificationsService.createNotification({
            userId: request.senderId,
            type: 'request_received',
            title: 'New Consultation Proposal',
            message: `${responderName} (${responderRole}) has responded to your ${request.metadata?.specialty} interest.`,
            data: { requestId: savedNewRequest.id, senderId: userId }
          });

          this.logger.debug(`Doctor ${userId} responded to service interest ${requestId} by creating new request ${savedNewRequest.id}`);
          return savedNewRequest;
        }

        this.validateRequestBeforeApproval(request);
        await this.handleApprovedRequest(request);
      }

      // Persist status after successful validation/handling for normal requests
      request.status = respondDto.action === 'approve' ? 'approved' : 'rejected';
      request.respondedAt = new Date();
      request.responseMessage = respondDto.message;

      // Merge response metadata into existing metadata or replace it
      if (respondDto.metadata) {
        request.metadata = {
          ...(request.metadata || {}),
          ...respondDto.metadata,
          respondedMetadata: respondDto.metadata // Keep a separate record of what was added in response
        };
      }

      const updatedRequest = await this.requestRepository.save(request);

      // Build a richer notification message if metadata exists (e.g. for appointments)
      const formattedType = request.requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const actionLabel = request.status === 'approved' ? 'accepted' : 'declined';

      let customMessage = `${responderName} has ${actionLabel} your ${formattedType.toLowerCase()} request.`;
      let isAppointment = false;
      if (respondDto.action === 'approve' && respondDto.metadata?.appointmentDate) {
        isAppointment = true;
        const { appointmentDate, appointmentTime, isOnline } = respondDto.metadata;
        customMessage = `${responderName} accepted and scheduled your ${formattedType.toLowerCase()} for ${appointmentDate} at ${appointmentTime} (${isOnline ? 'Online' : 'Physical'}).`;
      }

      // Send notification to sender
      await this.notificationsService.createNotification({
        userId: request.senderId,
        type: isAppointment ? 'appointment_scheduled' : 'request_responded',
        title: isAppointment ? 'Workflow Accepted & Scheduled' : 'Request Response',
        message: customMessage,
        data: {
          requestId: request.id,
          recipientId: userId,
          formDetails: respondDto.metadata
        }
      });

      // Also notify the acceptor (the user who just filled the form) as their "copy"
      if (respondDto.action === 'approve') {
        await this.notificationsService.createNotification({
          userId: userId,
          type: isAppointment ? 'appointment_scheduled' : 'request_responded',
          title: 'Proposal Successfully Scheduled',
          message: isAppointment
            ? `You have scheduled ${request.requestType} for ${respondDto.metadata.appointmentDate}.`
            : `You have approved the ${request.requestType} proposal.`,
          data: { requestId: request.id, senderId: request.senderId, formDetails: respondDto.metadata }
        });
      }

      this.logger.debug(`Request responded successfully: ${requestId}`);
      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error responding to request: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validate required inputs for request approval. Throws 400 with details if invalid.
   */
  private validateRequestBeforeApproval(request: UserRequest): void {
    const missingFields: string[] = [];

    switch (request.requestType) {
      case 'job_application': {
        const hasCenterId = Boolean((request.metadata as Record<string, unknown> | undefined)?.centerId);
        if (!hasCenterId) missingFields.push('metadata.centerId');
        // role is optional; defaults handled later
        break;
      }
      // Add other request types' required fields here as product evolves
      default:
        break;
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        error: 'Missing required fields for approval',
        requestId: request.id,
        requestType: request.requestType,
        missing: missingFields,
        message: `Cannot approve ${request.requestType} because required field(s) are missing`,
      });
    }
  }

  /**
   * Handle business logic for approved requests based on request type
   */
  private async handleApprovedRequest(request: UserRequest): Promise<void> {
    try {
      switch (request.requestType) {
        case 'job_application':
          await this.handleJobApplicationApproval(request);
          break;
        case 'connection':
          // Handle connection approval logic here if needed
          this.logger.debug(`Connection request approved: ${request.id}`);
          break;
        case 'collaboration':
          // Handle collaboration approval logic here if needed
          this.logger.debug(`Collaboration request approved: ${request.id}`);
          break;
        case 'patient_request':
          await this.handlePatientRequestApproval(request);
          break;
        case 'staff_invitation':
          // Handle staff invitation approval logic here if needed
          this.logger.debug(`Staff invitation approved: ${request.id}`);
          break;
        case 'referral':
          // Handle referral approval logic here if needed
          this.logger.debug(`Referral request approved: ${request.id}`);
          break;
        case 'service_quote':
        case 'appointment_proposal':
        case 'treatment_proposal':
        case 'call_request':
        case 'consultation_request':
          await this.handleServiceQuoteApproval(request);
          break;
        default:
          this.logger.warn(`Unknown request type: ${request.requestType}`);
      }
    } catch (error) {
      this.logger.error(`Error handling approved request: ${error.message}`, error.stack);
      // Don't throw here to avoid breaking the main approval flow
    }
  }

  /**
   * Handle job application approval by adding doctor to center staff
   */
  private async handleJobApplicationApproval(request: UserRequest): Promise<void> {
    try {
      // Extract center ID from request metadata
      const centerId = request.metadata?.centerId as string;

      if (!centerId) {
        // Should be caught earlier by validateRequestBeforeApproval; keep as guard
        this.logger.error(`Job application request ${request.id} missing centerId in metadata`);
        throw new BadRequestException({
          error: 'Missing required fields for approval',
          requestId: request.id,
          requestType: request.requestType,
          missing: ['metadata.centerId']
        });
      }

      // Determine the role from metadata or default to 'doctor'
      const role = (request.metadata?.role as string) || 'doctor';

      // Add the sender (doctor) to the center's staff
      await this.centersService.addStaffMember(centerId, request.senderId, role);

      this.logger.debug(`Doctor ${request.senderId} added to center ${centerId} as ${role}`);

      // Send additional notification about staff addition
      await this.notificationsService.createNotification({
        userId: request.senderId,
        type: 'staff_added',
        title: 'Welcome to the Team!',
        message: `You have been added as ${role} to the healthcare center`,
        data: { centerId, role, requestId: request.id }
      });

    } catch (error) {
      this.logger.error(`Error handling job application approval: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Handle patient request approval by creating patient-provider relationship
   */
  private async handlePatientRequestApproval(request: UserRequest): Promise<void> {
    try {
      // Extract patient/provider info from metadata if present; otherwise derive from sender/recipient
      const metadata = (request.metadata || {}) as Record<string, unknown>;

      let patientId = metadata.patientId as string | undefined;
      const providerId = (metadata.providerId as string | undefined) || request.recipientId;
      let providerType = (metadata.providerType as ('doctor' | 'center') | undefined);

      // Derive patientId from sender (user) when not provided in metadata
      if (!patientId) {
        try {
          const patient = await this.patientsService.findByUserId(request.senderId);
          patientId = patient.id;
        } catch {
          // leave undefined; will be validated below
        }
      }

      // Infer providerType from recipient roles when not provided
      if (!providerType) {
        const isCenter = Array.isArray(request.recipient?.roles) && request.recipient.roles.includes('center');
        providerType = isCenter ? 'center' : 'doctor';
      }

      if (!patientId || !providerId || !providerType) {
        this.logger.error(`Patient request ${request.id} missing required metadata`, {
          patientId,
          providerId,
          providerType,
          metadata: request.metadata
        });
        throw new BadRequestException({
          error: 'Missing required fields for patient request approval',
          requestId: request.id,
          requestType: request.requestType,
          missing: ['metadata.patientId', 'metadata.providerId', 'metadata.providerType']
        });
      }

      // Create patient-provider relationship
      await this.patientsService.createPatientProviderRelationship(
        patientId,
        providerId,
        providerType,
        request.recipientId, // The person who approved the request
        request.id, // Link to the original request
        {
          requestMessage: request.message,
          approvedAt: new Date().toISOString(),
          requestType: request.requestType
        }
      );

      this.logger.debug(`Patient-provider relationship created: patient ${patientId} -> ${providerType} ${providerId}`);

      // Send notification to patient about approval
      await this.notificationsService.createNotification({
        userId: request.senderId,
        type: 'request_approved',
        title: 'Provider Request Approved',
        message: `Your request to connect with ${providerType === 'doctor' ? 'the doctor' : 'the healthcare center'} has been approved`,
        data: {
          requestId: request.id,
          providerId,
          providerType,
          patientId
        }
      });

    } catch (error) {
      this.logger.error(`Error handling patient request approval: ${error.message}`, error.stack);
      throw error;
    }
  }

  async cancelRequest(requestId: string, userId: string): Promise<void> {
    try {
      this.logger.debug(`Cancelling request: ${requestId}`);

      const request = await this.requestRepository.findOne({
        where: { id: requestId, senderId: userId }
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      if (request.status !== 'pending') {
        throw new ConflictException('Cannot cancel a request that has already been processed');
      }

      request.status = 'cancelled';
      await this.requestRepository.save(request);

      this.logger.debug(`Request cancelled successfully: ${requestId}`);
    } catch (error) {
      this.logger.error(`Error cancelling request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async confirmRequest(requestId: string, userId: string): Promise<UserRequest> {
    try {
      this.logger.debug(`Confirming request: ${requestId} by user: ${userId}`);

      const request = await this.requestRepository.findOne({
        where: { id: requestId, senderId: userId },
        relations: ['sender', 'recipient']
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      if (request.status !== 'approved') {
        throw new ConflictException('Only approved requests can be confirmed');
      }

      request.status = 'scheduled';
      const updatedRequest = await this.requestRepository.save(request);

      // Send notification to recipient (provider)
      await this.notificationsService.createNotification({
        userId: request.recipientId,
        type: 'request_confirmed',
        title: 'Appointment Confirmed',
        message: `The patient has confirmed the appointment schedule for ${request.requestType}`,
        data: { requestId: request.id, senderId: userId }
      });

      this.logger.debug(`Request confirmed successfully: ${requestId}`);
      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error confirming request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async declineResponse(requestId: string, userId: string): Promise<UserRequest> {
    try {
      this.logger.debug(`Declining response for request: ${requestId} by user: ${userId}`);

      const request = await this.requestRepository.findOne({
        where: { id: requestId, senderId: userId },
        relations: ['sender', 'recipient']
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      if (request.status !== 'approved') {
        throw new ConflictException('Only approved requests can be declined');
      }

      request.status = 'declined';
      const updatedRequest = await this.requestRepository.save(request);

      // Send notification to recipient (provider)
      await this.notificationsService.createNotification({
        userId: request.recipientId,
        type: 'response_declined',
        title: 'Schedule Declined',
        message: `The patient has declined the proposed schedule for ${request.requestType}`,
        data: { requestId: request.id, senderId: userId }
      });

      this.logger.debug(`Response declined successfully: ${requestId}`);
      return updatedRequest;
    } catch (error) {
      this.logger.error(`Error declining response: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRequestById(requestId: string): Promise<RequestResponseDto> {
    try {
      this.logger.debug(`Getting request by ID: ${requestId}`);

      const request = await this.requestRepository.findOne({
        where: { id: requestId },
        relations: ['sender', 'recipient', 'sender.profile', 'recipient.profile']
      });

      if (!request) {
        throw new NotFoundException('Request not found');
      }

      // Transform to safe DTO to exclude sensitive data
      return this.transformToRequestResponse(request);
    } catch (error) {
      this.logger.error(`Error getting request by ID: ${error.message}`, error.stack);
      throw error;
    }
  }
  /**
   * Handle service quote approval by creating an appointment
   */
  private async handleServiceQuoteApproval(request: UserRequest): Promise<void> {
    try {
      // Data provided by the patient in respondToRequest is in respondedMetadata
      const respondedMetadata = request.metadata?.respondedMetadata as {
        appointmentDate?: string;
        appointmentTime?: string;
        isOnline?: boolean;
        address?: string;
        comments?: string;
      };

      if (!respondedMetadata) {
        throw new BadRequestException('Missing appointment details in approval');
      }

      const { appointmentDate, appointmentTime, isOnline, address, comments } = respondedMetadata;

      if (!appointmentDate || !appointmentTime) {
        throw new BadRequestException('Appointment date and time are mandatory');
      }

      // Parse date and time
      const dateTime = new Date(`${appointmentDate}T${appointmentTime}`);

      // Variables for appointment creation
      let appliedCenterId = (request.metadata?.centerId as string);
      const appliedServiceName = (request.metadata?.serviceName as string) || (request.metadata?.title as string) || 'Healthcare Service';
      let patientId = (request.metadata?.patientId as string) || null;

      // Find patient record (optional for staff-to-staff interactions)
      try {
        const patient = await this.patientsService.findByUserId(request.recipientId);
        if (patient) patientId = patient.id;
      } catch (e) {
        // Recipient is likely not a patient, which is fine in the new generalized workflow
        this.logger.debug(`Recipient ${request.recipientId} is not a patient. Proceeding with patientId: ${patientId}`);
      }

      // Try to resolve centerId more if missing
      if (!appliedCenterId) {
        try {
          // If sender or recipient is a center staff, get their primary center
          const senderCenters = await this.centersService.findByUserId(request.senderId);
          if (senderCenters?.length > 0) appliedCenterId = senderCenters[0].id;
          else {
            const recipientCenters = await this.centersService.findByUserId(request.recipientId);
            if (recipientCenters?.length > 0) appliedCenterId = recipientCenters[0].id;
          }
        } catch (e) {
          appliedCenterId = 'default-center';
        }
      }
      if (!appliedCenterId) appliedCenterId = 'default-center';

      // Create appointment
      const appointment = await this.appointmentsService.create({
        patientId: patientId, // Now nullable
        centerId: appliedCenterId,
        providerId: request.senderId, // Usually the one who initiated the workflow
        appointmentDate: dateTime.toISOString(),
        durationMinutes: 30,
        appointmentType: isOnline ? 'telehealth' : 'in-office',
        reason: `${appliedServiceName} - Workflow Interaction accepted`,
        notes: comments || '',
        doctor: request.sender?.profile?.displayName || 'Assigned Professional',
        locationType: isOnline ? 'online' : 'physical',
        locationAddress: isOnline ? 'Online Meeting' : (address as string || 'Physical Location')
      } as CreateAppointmentDto, request.recipientId);

      // Add participants to ensure everyone has their own "copy" / visibility in calendars
      await this.appointmentsService.addParticipant(appointment.id, request.senderId, 'initiator');
      await this.appointmentsService.addParticipant(appointment.id, request.recipientId, 'acceptor');

      // If there is a patient involved who is not the sender/recipient, add them too
      if (patientId) {
        try {
          const patientRecord = await this.patientsService.findOne(patientId);
          if (patientRecord?.userId && patientRecord.userId !== request.senderId && patientRecord.userId !== request.recipientId) {
            await this.appointmentsService.addParticipant(appointment.id, patientRecord.userId, 'patient');

            // Notify the patient too
            await this.notificationsService.createNotification({
              userId: patientRecord.userId,
              type: 'appointment_scheduled',
              title: 'Healthcare Schedule Created',
              message: `A new ${appliedServiceName} has been scheduled for you on ${appointmentDate} at ${appointmentTime}.`,
              data: { appointmentId: appointment.id, requestId: request.id }
            });
          }
        } catch (e) {
          this.logger.warn(`Failed to add patient participant: ${e.message}`);
        }
      }

      this.logger.debug(`Appointment/Schedule created for workflow approval: ${request.id}`);

    } catch (error) {
      this.logger.error(`Error handling service quote approval: ${error.message}`, error.stack);
      throw error;
    }
  }
}

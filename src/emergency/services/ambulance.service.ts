import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ambulance, AmbulanceStatus, AmbulanceType } from '../entities/ambulance.entity';
import { AmbulanceRequest, RequestStatus, Priority } from '../entities/ambulance-request.entity';
import { LocationService } from '../../location/services/location.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { SmsService } from '../../integrations/sms.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { EmergencyMedicalData } from '../entities/emergency-medical-data.entity';
import { EmergencyGateway } from '../emergency.gateway';

// Define JsonObject type locally since TypeORM doesn't export it
type JsonObject = Record<string, unknown>;

@Injectable()
export class AmbulanceService {
  private readonly logger = new Logger(AmbulanceService.name);

  constructor(
    @InjectRepository(Ambulance)
    private ambulanceRepository: Repository<Ambulance>,
    @InjectRepository(AmbulanceRequest)
    private requestRepository: Repository<AmbulanceRequest>,
    private locationService: LocationService,
    private notificationsService: NotificationsService,
    private smsService: SmsService,
    private auditLogService: AuditLogService,
    private emergencyGateway: EmergencyGateway,
  ) { }

  async createAmbulanceRequest(requestData: {
    patientName: string;
    patientAge?: number;
    patientGender?: string;
    patientPhone: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    pickupLatitude: number;
    pickupLongitude: number;
    pickupAddress: string;
    destinationLatitude?: number;
    destinationLongitude?: number;
    destinationAddress?: string;
    medicalCondition: string;
    symptoms?: string;
    priority: Priority;
    specialRequirements?: string;
    medicalHistory?: EmergencyMedicalData;
    requestedBy: string;
    insuranceInfo?: JsonObject;
  }): Promise<AmbulanceRequest> {
    try {
      // Generate unique request number
      const requestNumber = `EMR-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Ensure coordinates are numbers
      const pickupLatitude = Number(requestData.pickupLatitude);
      const pickupLongitude = Number(requestData.pickupLongitude);

      // Validate pickup coordinates
      this.locationService.validateCoordinates(pickupLatitude, pickupLongitude);

      // Create request
      const request = this.requestRepository.create({
        ...requestData,
        pickupLatitude,
        pickupLongitude,
        requestNumber,
        status: RequestStatus.PENDING,
      });

      const savedRequest = await this.requestRepository.save(request);

      // Find and dispatch nearest ambulance
      await this.dispatchNearestAmbulance(savedRequest);

      // Send app-based notifications (Real-time)
      // 1. Notify the requester (Patient)
      await this.notificationsService.createNotification({
        userId: requestData.requestedBy,
        title: 'Ambulance Request Received',
        message: `Your request ${requestNumber} is being processed.`,
        type: 'system',
        isUrgent: true,
        data: { requestId: savedRequest.id, requestNumber: savedRequest.requestNumber }
      });

      // 2. Broadcast to all active ambulance drivers/admins (Visual/Sound alert)
      await this.notificationsService.broadcast({
        title: '🚨 NEW EMERGENCY REQUEST',
        message: `Critical: ${requestData.medicalCondition} at ${requestData.pickupAddress}`,
        type: 'emergency',
        isUrgent: true,
        data: {
          requestId: savedRequest.id,
          requestNumber: savedRequest.requestNumber,
          priority: savedRequest.priority,
          location: { lat: pickupLatitude, lng: pickupLongitude }
        }
      }, { roles: ['ambulance_driver', 'admin'] });

      // Send legacy SMS notifications
      await this.sendRequestNotifications(savedRequest);

      await this.auditLogService.log({
        action: 'CREATE_AMBULANCE_REQUEST',
        entityType: 'AmbulanceRequest',
        entityId: savedRequest.id,
        userId: requestData.requestedBy,
        details: {
          requestNumber: savedRequest.requestNumber,
          priority: savedRequest.priority,
          location: `${pickupLatitude},${pickupLongitude}`,
        },
      });

      this.logger.log(`Ambulance request created: ${savedRequest.requestNumber}`);
      return savedRequest;
    } catch (error) {
      this.logger.error(`Failed to create ambulance request: ${error.message}`, error.stack);
      throw error;
    }
  }

  async dispatchNearestAmbulance(request: AmbulanceRequest): Promise<void> {
    try {
      // Find available ambulances
      const availableAmbulances = await this.ambulanceRepository.find({
        where: {
          status: AmbulanceStatus.AVAILABLE,
          isActive: true
        },
      });

      // If no ambulances available, create a mock one for testing
      if (availableAmbulances.length === 0) {
        this.logger.warn('No ambulances available, creating mock ambulance for testing');

        const mockSuffix = Math.random().toString(36).substr(2, 4).toUpperCase();
        const mockAmbulance = this.ambulanceRepository.create({
          vehicleNumber: `MOCK-${mockSuffix}`,
          licensePlate: `TEST-${mockSuffix}`,
          type: AmbulanceType.BASIC,
          status: AmbulanceStatus.AVAILABLE,
          isActive: true,
          currentLatitude: request.pickupLatitude + 0.01,
          currentLongitude: request.pickupLongitude + 0.01,
          contactNumber: '+1234567890',
          crewMembers: {
            paramedic: 'Test Paramedic',
            emt: 'Test EMT',
            driver: 'Test Driver'
          },
          equipmentList: ['Defibrillator', 'Oxygen', 'First Aid Kit'],
        });

        const savedMockAmbulance = await this.ambulanceRepository.save(mockAmbulance);
        availableAmbulances.push(savedMockAmbulance);
      }

      // Calculate distances and find nearest
      const ambulancesWithDistance = await Promise.all(
        availableAmbulances.map(async (ambulance) => {
          if (!ambulance.currentLatitude || !ambulance.currentLongitude) {
            this.logger.warn(`Ambulance ${ambulance.vehicleNumber} has no location data`);
            return { ambulance, distance: Infinity };
          }

          try {
            const distance = this.locationService.calculateDistance(
              {
                latitude: Number(ambulance.currentLatitude),
                longitude: Number(ambulance.currentLongitude),
              },
              {
                latitude: Number(request.pickupLatitude),
                longitude: Number(request.pickupLongitude),
              }
            );

            return { ambulance, distance };
          } catch (error) {
            this.logger.error(`Failed to calculate distance for ambulance ${ambulance.vehicleNumber}: ${error.message}`);
            return { ambulance, distance: Infinity };
          }
        })
      );

      // Sort by distance and priority factors
      ambulancesWithDistance.sort((a, b) => {
        // Prioritize based on ambulance type for critical cases
        if (request.priority === Priority.CRITICAL) {
          if (a.ambulance.type === AmbulanceType.CRITICAL_CARE && b.ambulance.type !== AmbulanceType.CRITICAL_CARE) {
            return -1;
          }
          if (b.ambulance.type === AmbulanceType.CRITICAL_CARE && a.ambulance.type !== AmbulanceType.CRITICAL_CARE) {
            return 1;
          }
        }
        return a.distance - b.distance;
      });

      const nearestAmbulance = ambulancesWithDistance[0].ambulance;

      // Update ambulance status
      await this.ambulanceRepository.update(nearestAmbulance.id, {
        status: AmbulanceStatus.DISPATCHED,
      });

      // Update request with ambulance assignment
      await this.requestRepository.update(request.id, {
        ambulanceId: nearestAmbulance.id,
        status: RequestStatus.DISPATCHED,
        dispatchedAt: new Date(),
        estimatedArrival: new Date(Date.now() + ambulancesWithDistance[0].distance * 2 * 60 * 1000), // Estimate 2 minutes per km
      });

      // Notify ambulance crew via app if they have a user account linked (future)
      // For now, we notify the specific ambulance via SMS and broadcast via app
      await this.notifyAmbulanceCrew(nearestAmbulance, request);

      // Targeted notification if we have a way to identify the driver's userId
      // (Currently we broadcast to the role for visibility)

      this.logger.log(`Ambulance ${nearestAmbulance.vehicleNumber} dispatched to request ${request.requestNumber}`);
    } catch (error) {
      this.logger.error(`Failed to dispatch ambulance: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateRequestStatus(
    requestId: string,
    status: RequestStatus,
    updates: Partial<AmbulanceRequest> = {}
  ): Promise<AmbulanceRequest> {
    const request = await this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['ambulance'],
    });

    if (!request) {
      throw new NotFoundException('Ambulance request not found');
    }

    const updateData: Partial<AmbulanceRequest> = { status, ...updates };

    // Set timestamp based on status
    switch (status) {
      case RequestStatus.ACKNOWLEDGED:
        updateData.acknowledgedAt = new Date();
        // Generate tracking number when acknowledged/accepted
        if (!request.trackingNumber) {
          updateData.trackingNumber = `TRK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        }
        break;
      case RequestStatus.EN_ROUTE:
        updateData.movingAt = new Date();
        break;
      case RequestStatus.ON_SCENE:
        updateData.arrivedAt = new Date();
        updateData.actualArrival = new Date();
        updateData.seenAt = new Date();
        break;
      case RequestStatus.COMPLETED:
        updateData.completedAt = new Date();
        updateData.deliveredAt = new Date();
        // Update ambulance status back to available
        if (request.ambulance) {
          await this.ambulanceRepository.update(request.ambulance.id, {
            status: AmbulanceStatus.AVAILABLE,
          });
        }
        break;
    }

    await this.requestRepository.update(requestId, updateData);

    // Emit status update via gateway
    this.emergencyGateway.sendStatusUpdate(requestId, status, updateData.trackingNumber || request.trackingNumber);

    // Send status update notifications
    await this.sendStatusUpdateNotifications(request, status);

    // Also send real-time app notification to the patient
    if (request.requestedBy) {
      await this.notificationsService.createNotification({
        userId: request.requestedBy,
        title: `Ambulance Update: ${status.replace('_', ' ').toUpperCase()}`,
        message: this.getStatusMessage(request, status),
        type: 'system',
        isUrgent: status === RequestStatus.DISPATCHED || status === RequestStatus.ON_SCENE,
        data: { requestId: request.id, status }
      });
    }

    return this.requestRepository.findOne({
      where: { id: requestId },
      relations: ['ambulance'],
    });
  }

  async updateAmbulanceLocation(
    ambulanceId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    this.locationService.validateCoordinates(latitude, longitude);

    await this.ambulanceRepository.update(ambulanceId, {
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    });

    // Find request the ambulance is currently serving and emit location
    const activeStatuses = [
      RequestStatus.DISPATCHED,
      RequestStatus.ACKNOWLEDGED,
      RequestStatus.EN_ROUTE,
      RequestStatus.TRANSPORTING,
      RequestStatus.ON_SCENE
    ];

    const requests = await this.requestRepository.find({
      where: {
        ambulanceId,
      }
    });

    const activeRequest = requests.find(r => activeStatuses.includes(r.status));

    if (activeRequest) {
      this.emergencyGateway.sendLocationUpdate(activeRequest.id, { latitude, longitude });
    }
  }

  async getAmbulanceRequests(filters: {
    status?: RequestStatus;
    priority?: Priority;
    ambulanceId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<{ requests: AmbulanceRequest[]; total: number }> {
    const query = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.ambulance', 'ambulance');

    if (filters.status) {
      query.andWhere('request.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      query.andWhere('request.priority = :priority', { priority: filters.priority });
    }

    if (filters.ambulanceId) {
      query.andWhere('request.ambulanceId = :ambulanceId', { ambulanceId: filters.ambulanceId });
    }

    if (filters.dateFrom) {
      query.andWhere('request.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('request.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    query.orderBy('request.createdAt', 'DESC');
    query.skip(offset).take(limit);

    const [requests, total] = await query.getManyAndCount();

    return { requests, total };
  }

  async getAvailableAmbulances(location?: { latitude: number; longitude: number }): Promise<Ambulance[]> {
    const ambulances = await this.ambulanceRepository.find({
      where: { status: AmbulanceStatus.AVAILABLE, isActive: true },
    });

    if (!location) {
      return ambulances;
    }

    // Sort by distance if location provided
    const ambulancesWithDistance = await Promise.all(
      ambulances.map(async (ambulance) => {
        if (!ambulance.currentLatitude || !ambulance.currentLongitude) {
          return { ambulance, distance: Infinity };
        }

        const distance = this.locationService.calculateDistance(
          location,
          {
            latitude: ambulance.currentLatitude,
            longitude: ambulance.currentLongitude,
          }
        );

        return { ambulance, distance };
      })
    );

    return ambulancesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .map(item => item.ambulance);
  }

  async getAmbulanceRequestById(id: string): Promise<AmbulanceRequest> {
    const request = await this.requestRepository.findOne({
      where: { id },
      relations: ['ambulance'],
    });

    if (!request) {
      throw new NotFoundException('Ambulance request not found');
    }

    return request;
  }

  private async notifyAmbulanceCrew(ambulance: Ambulance, request: AmbulanceRequest): Promise<void> {
    try {
      // Send SMS to ambulance crew
      if (ambulance.contactNumber) {
        await this.smsService.sendSms({
          to: ambulance.contactNumber,
          message: `DISPATCH: ${request.requestNumber} - ${request.medicalCondition} at ${request.pickupAddress}. Priority: ${request.priority}. Contact: ${request.patientPhone}`,
          type: 'transactional',
        });
      }

      this.logger.log(`Dispatch notification sent to ambulance ${ambulance.vehicleNumber}`);
    } catch (error) {
      this.logger.error(`Failed to notify ambulance crew: ${error.message}`, error.stack);
    }
  }

  private async sendRequestNotifications(request: AmbulanceRequest): Promise<void> {
    try {
      // Send confirmation SMS to patient
      await this.smsService.sendSms({
        to: request.patientPhone,
        message: `Your ambulance request ${request.requestNumber} has been received. An ambulance will be dispatched shortly. Emergency services: 911`,
        type: 'transactional',
      });

      // Notify emergency contact if provided
      if (request.emergencyContactPhone) {
        await this.smsService.sendSms({
          to: request.emergencyContactPhone,
          message: `Emergency: ${request.patientName} has requested an ambulance. Request: ${request.requestNumber}. Location: ${request.pickupAddress}`,
          type: 'transactional',
        });
      }

      this.logger.log(`Request notifications sent for ${request.requestNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send request notifications: ${error.message}`, error.stack);
    }
  }

  private async sendStatusUpdateNotifications(request: AmbulanceRequest, status: RequestStatus): Promise<void> {
    try {
      let message = '';

      switch (status) {
        case RequestStatus.ACKNOWLEDGED:
          message = `Ambulance request ${request.requestNumber} accepted. Tracking number: ${request.trackingNumber || 'PENDING'}. You can track your ambulance now.`;
          break;
        case RequestStatus.DISPATCHED:
          message = `Ambulance dispatched for request ${request.requestNumber}. ETA: ${request.estimatedArrival?.toLocaleTimeString()}`;
          break;
        case RequestStatus.EN_ROUTE:
          message = `Ambulance is now moving towards your location for request ${request.requestNumber}. Track in real-time.`;
          break;
        case RequestStatus.ON_SCENE:
          message = `Ambulance has arrived at your location for request ${request.requestNumber}`;
          break;
        case RequestStatus.TRANSPORTING:
          message = `Patient being transported. Tracking active throughout the journey.`;
          break;
        case RequestStatus.COMPLETED:
          message = `Patient successfully delivered to ${request.deliveryDetails?.hospitalName || 'healthcare facility'}. Request completed.`;
          break;
      }

      if (message) {
        await this.smsService.sendSms({
          to: request.patientPhone,
          message,
          type: 'transactional',
        });
      }

      this.logger.log(`Status update notification sent for ${request.requestNumber}: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to send status update: ${error.message}`, error.stack);
    }
  }

  private getStatusMessage(request: AmbulanceRequest, status: RequestStatus): string {
    switch (status) {
      case RequestStatus.ACKNOWLEDGED:
        return `Ambulance request ${request.requestNumber} accepted and confirmed.`;
      case RequestStatus.DISPATCHED:
        return `Ambulance assigned! Assigned Vehicle: ${request.ambulance?.vehicleNumber || 'Assigned'}. ETA: ${request.estimatedArrival?.toLocaleTimeString() || 'Calculating...'}`;
      case RequestStatus.EN_ROUTE:
        return `Ambulance is moving towards ${request.pickupAddress}.`;
      case RequestStatus.ON_SCENE:
        return `Ambulance has arrived at the pickup location.`;
      case RequestStatus.COMPLETED:
        return `Request completed. Patient safely delivered.`;
      default:
        return `Update for your ambulance request: ${status}`;
    }
  }
}

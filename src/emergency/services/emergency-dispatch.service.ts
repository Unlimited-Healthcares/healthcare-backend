import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyDispatch } from '../entities/emergency-dispatch.entity';
import { EmergencyAlert } from '../entities/emergency-alert.entity';
import { AmbulanceRequest } from '../entities/ambulance-request.entity';
import { JsonObject } from '../../types/common.types';
import { LocationService } from '../../location/services/location.service';
import { AmbulanceService } from './ambulance.service';
import { EmergencyAlertsService } from './emergency-alerts.service';
import { SmsService } from '../../integrations/sms.service';

interface EmergencyCoordinationData {
  type: 'ambulance' | 'fire' | 'police' | 'medical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: { latitude: number; longitude: number };
  address?: string;
  description: string;
  contactNumber: string;
}

export interface ServiceLocation {
  id: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  distance: number;
  available: boolean;
}

@Injectable()
export class EmergencyDispatchService {
  private readonly logger = new Logger(EmergencyDispatchService.name);

  constructor(
    @InjectRepository(EmergencyDispatch)
    private dispatchRepository: Repository<EmergencyDispatch>,
    @InjectRepository(EmergencyAlert)
    private alertRepository: Repository<EmergencyAlert>,
    @InjectRepository(AmbulanceRequest)
    private ambulanceRequestRepository: Repository<AmbulanceRequest>,
    private locationService: LocationService,
    private ambulanceService: AmbulanceService,
    private emergencyAlertsService: EmergencyAlertsService,
    private smsService: SmsService,
  ) {}

  async coordinateEmergencyResponse(emergencyData: EmergencyCoordinationData, requestedBy: string): Promise<JsonObject> {
    // Create dispatch record
    const dispatch = this.dispatchRepository.create({
      emergencyType: emergencyData.type,
      priority: emergencyData.priority,
      location: `${emergencyData.location.latitude},${emergencyData.location.longitude}`,
      address: emergencyData.address,
      description: emergencyData.description,
      contactNumber: emergencyData.contactNumber,
      dispatchedBy: requestedBy,
      status: 'dispatched',
      dispatchTime: new Date(),
    });

    const savedDispatch = await this.dispatchRepository.save(dispatch);

    // Find and notify nearest services
    const nearestServices = await this.findNearestServices(
      emergencyData.location.latitude,
      emergencyData.location.longitude,
      emergencyData.type
    );

    // Coordinate response based on emergency type
    const coordinationResult = await this.coordinateByType(emergencyData, nearestServices);

    return {
      dispatchId: savedDispatch.id,
      coordinationResult,
      nearestServices,
      estimatedResponseTime: this.calculateResponseTime(nearestServices[0]),
    };
  }

  async findNearestServices(latitude: number, longitude: number, serviceType?: string): Promise<ServiceLocation[]> {
    // Mock implementation - in real scenario, this would query actual service databases
    const mockServices: ServiceLocation[] = [
      {
        id: '1',
        name: 'Central Hospital',
        type: 'medical',
        latitude: latitude + 0.01,
        longitude: longitude + 0.01,
        distance: 1.2,
        available: true,
      },
      {
        id: '2',
        name: 'Fire Station 1',
        type: 'fire',
        latitude: latitude + 0.02,
        longitude: longitude + 0.02,
        distance: 2.1,
        available: true,
      },
    ];

    return serviceType 
      ? mockServices.filter(service => service.type === serviceType)
      : mockServices;
  }

  private async coordinateByType(emergencyData: EmergencyCoordinationData, services: ServiceLocation[]): Promise<JsonObject> {
    switch (emergencyData.type) {
      case 'ambulance':
      case 'medical':
        return this.coordinateMedicalResponse(emergencyData, services);
      case 'fire':
        return this.coordinateFireResponse(emergencyData, services);
      case 'police':
        return this.coordinatePoliceResponse(emergencyData, services);
      default:
        return { message: 'Emergency type not supported' };
    }
  }

  private async coordinateMedicalResponse(emergencyData: EmergencyCoordinationData, services: ServiceLocation[]): Promise<JsonObject> {
    const medicalServices = services.filter(s => s.type === 'medical' && s.available);
    
    return {
      type: 'medical',
      assignedServices: medicalServices.slice(0, 2),
      actions: ['Ambulance dispatched', 'Medical team notified'],
      estimatedArrival: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
  }

  private async coordinateFireResponse(emergencyData: EmergencyCoordinationData, services: ServiceLocation[]): Promise<JsonObject> {
    const fireServices = services.filter(s => s.type === 'fire' && s.available);
    
    return {
      type: 'fire',
      assignedServices: fireServices.slice(0, 1),
      actions: ['Fire truck dispatched', 'Fire department notified'],
      estimatedArrival: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    };
  }

  private async coordinatePoliceResponse(emergencyData: EmergencyCoordinationData, services: ServiceLocation[]): Promise<JsonObject> {
    const policeServices = services.filter(s => s.type === 'police' && s.available);
    
    return {
      type: 'police',
      assignedServices: policeServices.slice(0, 2),
      actions: ['Police unit dispatched', 'Backup requested'],
      estimatedArrival: new Date(Date.now() + 8 * 60 * 1000), // 8 minutes
    };
  }

  private calculateResponseTime(nearestService: ServiceLocation | undefined): number {
    // Default response time if no service found
    if (!nearestService) {
      return 15; // 15 minutes default
    }
    
    // Simple calculation based on distance
    return Math.ceil(nearestService.distance * 2); // 2 minutes per km
  }

  async updateDispatchStatus(dispatchId: string, status: string, notes?: string): Promise<EmergencyDispatch> {
    const dispatch = await this.dispatchRepository.findOne({ where: { id: dispatchId } });
    
    if (!dispatch) {
      throw new Error('Dispatch not found');
    }

    dispatch.status = status;
    if (notes) {
      dispatch.notes = notes;
    }

    if (status === 'completed') {
      dispatch.completedAt = new Date();
    }

    return this.dispatchRepository.save(dispatch);
  }

  async getDispatchHistory(filters: JsonObject): Promise<JsonObject> {
    const queryBuilder = this.dispatchRepository.createQueryBuilder('dispatch');

    if (filters.emergencyType) {
      queryBuilder.andWhere('dispatch.emergencyType = :type', { type: filters.emergencyType });
    }

    if (filters.status) {
      queryBuilder.andWhere('dispatch.status = :status', { status: filters.status });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('dispatch.dispatchTime >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('dispatch.dispatchTime <= :endDate', { endDate: filters.endDate });
    }

    const [dispatches, total] = await queryBuilder
      .orderBy('dispatch.dispatchTime', 'DESC')
      .getManyAndCount();

    return {
      dispatches,
      total,
      summary: {
        totalDispatches: total,
        completedDispatches: dispatches.filter(d => d.status === 'completed').length,
        activeDispatches: dispatches.filter(d => d.status === 'active').length,
      },
    };
  }
}

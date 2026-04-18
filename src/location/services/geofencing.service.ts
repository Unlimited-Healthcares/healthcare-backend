import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GeofenceZone } from '../entities/geofence-zone.entity';
import { GeofenceStatus } from '../../types/location.types';
import { AuditService } from '../../audit/audit.service';

interface CreateGeofenceZoneDto {
  name: string;
  description?: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  centerId?: string;
}

interface UpdateGeofenceZoneDto {
  name?: string;
  description?: string;
  centerLatitude?: number;
  centerLongitude?: number;
  radius?: number;
  centerId?: string;
  status?: GeofenceStatus;
}

@Injectable()
export class GeofencingService {
  constructor(
    @InjectRepository(GeofenceZone)
    private readonly geofenceRepository: Repository<GeofenceZone>,
    private readonly auditService: AuditService,
  ) {}

  async createGeofenceZone(
    dto: CreateGeofenceZoneDto,
    createdBy: string,
  ): Promise<GeofenceZone> {
    try {
      const geofenceZone = this.geofenceRepository.create({
        ...dto,
        createdBy,
        status: GeofenceStatus.ACTIVE,
      });

      const savedZone = await this.geofenceRepository.save(geofenceZone);

      await this.auditService.logActivity(
        createdBy,
        'geofence_zone',
        'CREATE',
        `Created geofence zone: ${dto.name}`,
        { geofenceZoneId: savedZone.id, ...dto },
      );

      return savedZone;
    } catch (error) {
      throw new BadRequestException(`Failed to create geofence zone: ${error.message}`);
    }
  }

  async updateGeofenceZone(
    id: string,
    dto: UpdateGeofenceZoneDto,
    updatedBy: string,
  ): Promise<GeofenceZone> {
    const existingZone = await this.geofenceRepository.findOne({ where: { id } });
    if (!existingZone) {
      throw new NotFoundException(`Geofence zone with ID ${id} not found`);
    }

    try {
      await this.geofenceRepository.update(id, dto);
      const updatedZone = await this.geofenceRepository.findOne({ where: { id } });

      await this.auditService.logActivity(
        updatedBy,
        'geofence_zone',
        'UPDATE',
        `Updated geofence zone: ${existingZone.name}`,
        { geofenceZoneId: id, changes: dto },
      );

      return updatedZone;
    } catch (error) {
      throw new BadRequestException(`Failed to update geofence zone: ${error.message}`);
    }
  }

  async deleteGeofenceZone(id: string, deletedBy: string): Promise<void> {
    const existingZone = await this.geofenceRepository.findOne({ where: { id } });
    if (!existingZone) {
      throw new NotFoundException(`Geofence zone with ID ${id} not found`);
    }

    try {
      await this.geofenceRepository.delete(id);

      await this.auditService.logActivity(
        deletedBy,
        'geofence_zone',
        'DELETE',
        `Deleted geofence zone: ${existingZone.name}`,
        { geofenceZoneId: id },
      );
    } catch (error) {
      throw new BadRequestException(`Failed to delete geofence zone: ${error.message}`);
    }
  }

  async getGeofenceZone(id: string): Promise<GeofenceZone> {
    const zone = await this.geofenceRepository.findOne({
      where: { id },
      relations: ['center', 'createdByUser'],
    });

    if (!zone) {
      throw new NotFoundException(`Geofence zone with ID ${id} not found`);
    }

    return zone;
  }

  async getGeofenceZonesByCenter(centerId: string): Promise<GeofenceZone[]> {
    return this.geofenceRepository.find({
      where: { centerId, status: GeofenceStatus.ACTIVE },
      relations: ['center', 'createdByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllGeofenceZones(): Promise<GeofenceZone[]> {
    return this.geofenceRepository.find({
      relations: ['center', 'createdByUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async checkGeofenceEntry(
    latitude: number,
    longitude: number,
    centerId?: string,
  ): Promise<GeofenceZone[]> {
    const whereCondition = centerId 
      ? { centerId, status: GeofenceStatus.ACTIVE }
      : { status: GeofenceStatus.ACTIVE };

    const activeZones = await this.geofenceRepository.find({
      where: whereCondition,
    });

    const enteredZones: GeofenceZone[] = [];

    for (const zone of activeZones) {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        zone.centerLatitude,
        zone.centerLongitude,
      );

      if (distance <= zone.radius) {
        enteredZones.push(zone);
      }
    }

    return enteredZones;
  }

  async activateGeofenceZone(id: string, activatedBy: string): Promise<GeofenceZone> {
    const zone = await this.getGeofenceZone(id);
    
    await this.geofenceRepository.update(id, { status: GeofenceStatus.ACTIVE });
    const updatedZone = await this.geofenceRepository.findOne({ where: { id } });

    await this.auditService.logActivity(
      activatedBy,
      'geofence_zone',
      'ACTIVATE',
      `Activated geofence zone: ${zone.name}`,
      { geofenceZoneId: id },
    );

    return updatedZone;
  }

  async deactivateGeofenceZone(id: string, deactivatedBy: string): Promise<GeofenceZone> {
    const zone = await this.getGeofenceZone(id);
    
    await this.geofenceRepository.update(id, { status: GeofenceStatus.INACTIVE });
    const updatedZone = await this.geofenceRepository.findOne({ where: { id } });

    await this.auditService.logActivity(
      deactivatedBy,
      'geofence_zone',
      'DEACTIVATE',
      `Deactivated geofence zone: ${zone.name}`,
      { geofenceZoneId: id },
    );

    return updatedZone;
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
} 
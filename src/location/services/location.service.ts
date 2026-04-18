import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  Coordinates, 
  LocationPoint, 
  DistanceCalculationOptions, 
  LocationValidationResult,
  LocationMetadata 
} from '../../types/location.types';
import { LocationHistory } from '../entities/location-history.entity';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);

  constructor(
    @InjectRepository(LocationHistory)
    private readonly locationHistoryRepository: Repository<LocationHistory>,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Validates GPS coordinates
   */
  validateCoordinates(latitude: number, longitude: number): LocationValidationResult {
    const errors: string[] = [];

    // Check if coordinates are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      errors.push('Latitude and longitude must be numbers');
    }

    // Check latitude range (-90 to 90)
    if (latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90 degrees');
    }

    // Check longitude range (-180 to 180)
    if (longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180 degrees');
    }

    // Check for invalid values
    if (isNaN(latitude) || isNaN(longitude)) {
      errors.push('Latitude and longitude cannot be NaN');
    }

    // Check for null island (0,0) which is often invalid
    if (latitude === 0 && longitude === 0) {
      errors.push('Coordinates (0,0) are likely invalid');
    }

    const isValid = errors.length === 0;
    const result: LocationValidationResult = {
      isValid,
      errors,
    };

    if (isValid) {
      result.normalizedLocation = {
        latitude: Number(latitude.toFixed(8)),
        longitude: Number(longitude.toFixed(8)),
      };
    }

    return result;
  }

  /**
   * Calculates distance between two points using Haversine formula
   */
  calculateDistance(
    point1: Coordinates, 
    point2: Coordinates, 
    options: Partial<DistanceCalculationOptions> = {}
  ): number {
    const { unit = 'km', precision = 2 } = options;

    try {
      // Validate coordinates
      const validation1 = this.validateCoordinates(point1.latitude, point1.longitude);
      const validation2 = this.validateCoordinates(point2.latitude, point2.longitude);

      if (!validation1.isValid || !validation2.isValid) {
        throw new BadRequestException('Invalid coordinates provided');
      }

      // Calculate distance using Haversine formula
      const distanceInMeters = this.haversineDistance(point1, point2);

      let distance: number;
      switch (unit) {
        case 'km':
          distance = distanceInMeters / 1000;
          break;
        case 'miles':
          distance = distanceInMeters / 1609.344;
          break;
        case 'meters':
        default:
          distance = distanceInMeters;
          break;
      }

      return Number(distance.toFixed(precision));
    } catch (error) {
      this.logger.error(`Distance calculation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to calculate distance');
    }
  }

  /**
   * Haversine formula implementation for distance calculation
   */
  private haversineDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const lat1Rad = this.degreesToRadians(point1.latitude);
    const lat2Rad = this.degreesToRadians(point2.latitude);
    const deltaLatRad = this.degreesToRadians(point2.latitude - point1.latitude);
    const deltaLngRad = this.degreesToRadians(point2.longitude - point1.longitude);

    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Finds points within a specified radius
   */
  findNearbyPoints(
    center: Coordinates, 
    radius: number, 
    points: LocationPoint[], 
    unit: 'km' | 'miles' | 'meters' = 'km'
  ): LocationPoint[] {
    try {
      const validation = this.validateCoordinates(center.latitude, center.longitude);
      if (!validation.isValid) {
        throw new BadRequestException('Invalid center coordinates');
      }

      if (radius <= 0) {
        throw new BadRequestException('Radius must be greater than 0');
      }

      return points.filter(point => {
        const distance = this.calculateDistance(center, point, { unit });
        return distance <= radius;
      });
    } catch (error) {
      this.logger.error(`Nearby points search failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Calculates the center point (centroid) of multiple coordinates
   */
  calculateCentroid(coordinates: Coordinates[]): Coordinates {
    if (!coordinates || coordinates.length === 0) {
      throw new BadRequestException('At least one coordinate is required');
    }

    if (coordinates.length === 1) {
      return coordinates[0];
    }

    try {
      let totalLat = 0;
      let totalLng = 0;

      coordinates.forEach(coord => {
        totalLat += coord.latitude;
        totalLng += coord.longitude;
      });

      return {
        latitude: totalLat / coordinates.length,
        longitude: totalLng / coordinates.length,
      };
    } catch (error) {
      this.logger.error(`Centroid calculation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to calculate centroid');
    }
  }

  /**
   * Checks if a point is within a circular area
   */
  isPointInRadius(
    point: Coordinates, 
    center: Coordinates, 
    radius: number, 
    unit: 'km' | 'miles' | 'meters' = 'km'
  ): boolean {
    const distance = this.calculateDistance(point, center, { unit });
    return distance <= radius;
  }

  /**
   * Gets the bearing (direction) from one point to another
   */
  getBearing(from: Coordinates, to: Coordinates): number {
    try {
      const lat1Rad = this.degreesToRadians(from.latitude);
      const lat2Rad = this.degreesToRadians(to.latitude);
      const deltaLngRad = this.degreesToRadians(to.longitude - from.longitude);

      const y = Math.sin(deltaLngRad) * Math.cos(lat2Rad);
      const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
                Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLngRad);

      const bearingRad = Math.atan2(y, x);
      const bearingDeg = this.radiansToDegrees(bearingRad);

      return (bearingDeg + 360) % 360; // Normalize to 0-360 degrees
    } catch (error) {
      this.logger.error(`Bearing calculation failed: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to calculate bearing');
    }
  }

  /**
   * Normalizes coordinates to standard precision
   */
  normalizeCoordinates(coordinates: Coordinates): Coordinates {
    return {
      latitude: Number(coordinates.latitude.toFixed(8)),
      longitude: Number(coordinates.longitude.toFixed(8)),
    };
  }

  /**
   * Records location history for audit purposes
   */
  async recordLocationHistory(
    entityType: string,
    entityId: string,
    location: Coordinates,
    options: {
      source?: string;
      accuracy?: number;
      previousAddress?: string;
      newAddress?: string;
      updatedBy?: string;
      updateReason?: string;
      metadata?: Record<string, unknown>;
    } = {}
  ): Promise<LocationHistory> {
    try {
      const validation = this.validateCoordinates(location.latitude, location.longitude);
      if (!validation.isValid) {
        throw new BadRequestException(`Invalid coordinates: ${validation.errors.join(', ')}`);
      }

      const locationHistory = this.locationHistoryRepository.create({
        entityType,
        entityId,
        latitude: location.latitude,
        longitude: location.longitude,
        source: options.source || 'manual',
        accuracy: options.accuracy,
        previousAddress: options.previousAddress,
        newAddress: options.newAddress,
        updatedBy: options.updatedBy,
        updateReason: options.updateReason,
        metadata: options.metadata,
        timestamp: new Date(),
      });

      const savedHistory = await this.locationHistoryRepository.save(locationHistory);

      // Log audit trail
      await this.auditService.logActivity(
        options.updatedBy || 'system',
        entityType,
        'LOCATION_UPDATE',
        `Location updated for ${entityType}:${entityId}`,
        {
          entityId,
          latitude: location.latitude,
          longitude: location.longitude,
          source: options.source,
          historyId: savedHistory.id,
        }
      );

      this.logger.log(`Location history recorded for ${entityType}:${entityId}`);
      return savedHistory;
    } catch (error) {
      this.logger.error(`Failed to record location history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Gets location history for an entity
   */
  async getLocationHistory(
    entityType: string,
    entityId: string,
    limit: number = 50
  ): Promise<LocationHistory[]> {
    try {
      return await this.locationHistoryRepository.find({
        where: { entityType, entityId },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`Failed to get location history: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generates location metadata
   */
  generateLocationMetadata(
    coordinates: Coordinates,
    additionalData: Record<string, unknown> = {}
  ): LocationMetadata {
    return {
      lastUpdated: new Date(),
      source: 'manual',
      verified: false,
      accuracy: null,
      ...additionalData,
    };
  }

  /**
   * Converts degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Converts radians to degrees
   */
  private radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }
} 
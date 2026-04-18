import { IsString, IsNumber, IsOptional, IsEnum, Min, Max, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GeofenceStatus } from '../../types/location.types';

export class UpdateGeofenceZoneDto {
  @ApiPropertyOptional({
    description: 'Name of the geofence zone',
    example: 'Main Hospital Entrance',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the geofence zone',
    example: 'Geofence zone for the main hospital entrance area',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Center latitude of the geofence zone',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  centerLatitude?: number;

  @ApiPropertyOptional({
    description: 'Center longitude of the geofence zone',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  centerLongitude?: number;

  @ApiPropertyOptional({
    description: 'Radius of the geofence zone in meters',
    example: 100,
    minimum: 1,
    maximum: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  radius?: number;

  @ApiPropertyOptional({
    description: 'Status of the geofence zone',
    enum: GeofenceStatus,
    example: GeofenceStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(GeofenceStatus)
  status?: GeofenceStatus;
} 
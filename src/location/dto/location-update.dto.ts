import { IsString, IsNumber, IsOptional, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LocationUpdateDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Street address',
    example: '123 Main St',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(0, 200)
  address?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'New York',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State or province',
    example: 'NY',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Country name',
    example: 'United States',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  country?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '10001',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @Length(0, 20)
  postalCode?: string;
}

export class NearbySearchDto {
  @ApiProperty({
    description: 'Search center latitude',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Search center longitude',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'Search radius in kilometers',
    example: 10,
    minimum: 0.1,
    maximum: 100,
  })
  @IsNumber()
  @Min(0.1)
  @Max(100)
  radius: number;

  @ApiPropertyOptional({
    description: 'Type of healthcare center to search for',
    example: 'hospital',
  })
  @IsOptional()
  @IsString()
  centerType?: string;

  @ApiPropertyOptional({
    description: 'Specific services to filter by',
    example: ['emergency', 'cardiology'],
    type: [String],
  })
  @IsOptional()
  services?: string[];

  @ApiPropertyOptional({
    description: 'Filter for emergency services only',
    example: false,
    default: false,
  })
  @IsOptional()
  emergencyOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of results to skip for pagination',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}

export class GeocodeAddressDto {
  @ApiProperty({
    description: 'Address to geocode',
    example: '123 Main St, New York, NY 10001',
    minLength: 5,
    maxLength: 500,
  })
  @IsString()
  @Length(5, 500)
  address: string;
}

export class ReverseGeocodeDto {
  @ApiProperty({
    description: 'Latitude coordinate',
    example: 40.7128,
    minimum: -90,
    maximum: 90,
  })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate',
    example: -74.0060,
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
} 
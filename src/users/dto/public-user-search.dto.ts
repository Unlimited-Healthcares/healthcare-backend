import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Public user data for search results - excludes all sensitive information
 * This DTO ensures no personal data is exposed in discovery/search endpoints
 */
export class PublicUserSearchDto {
  @ApiProperty({
    description: 'User UUID identifier',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Public user identifier for search results',
    example: 'DR919768304'
  })
  publicId?: string;

  @ApiProperty({
    description: 'User display name for search results',
    example: 'Dr. John Smith'
  })
  displayName: string;

  @ApiProperty({
    description: 'Medical specialty',
    example: 'Cardiology',
    required: false
  })
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Professional license expiry date',
    example: '2025-12-31'
  })
  licenseExpiryDate?: Date;

  @ApiProperty({
    description: 'Public phone number for professional contact',
    example: '+1-555-123-4567',
    required: false
  })
  phone?: string;

  @ApiProperty({
    description: 'General location information (no exact coordinates)',
    required: false,
    type: 'object',
    properties: {
      city: { type: 'string', example: 'New York' },
      state: { type: 'string', example: 'NY' },
      country: { type: 'string', example: 'United States' }
    }
  })
  location?: {
    city: string;
    state: string;
    country: string;
  };

  @ApiProperty({
    description: 'User rating (if available)',
    example: 4.5,
    required: false
  })
  rating?: number;

  @ApiProperty({
    description: 'Profile avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false
  })
  avatar?: string;

  @ApiProperty({
    description: 'Professional qualifications',
    example: ['MD', 'Board Certified Cardiologist'],
    required: false,
    type: [String]
  })
  qualifications?: string[];

  @ApiProperty({
    description: 'Years of experience',
    example: '10+ years',
    required: false
  })
  experience?: string;

  @ApiProperty({
    description: 'Availability information (general schedule)',
    required: false,
    type: 'object',
    properties: {
      timezone: { type: 'string', example: 'America/New_York' },
      generalAvailability: { type: 'string', example: 'Monday-Friday, 9AM-5PM' }
    }
  })
  availability?: {
    timezone: string;
    generalAvailability: string;
  };

  @ApiPropertyOptional({
    description: 'Services offered by the user with pricing',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        price: { type: 'number' },
        currency: { type: 'string' },
        category: { type: 'string' }
      }
    }
  })
  offeredServices?: Array<{
    id?: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Payment settings and fee information',
    required: false,
    type: 'object',
    properties: {
      requireUpfrontPayment: { type: 'boolean' },
      consultationFee: { type: 'number' },
      appointmentFee: { type: 'number' },
      serviceFee: { type: 'number' },
      currency: { type: 'string' }
    }
  })
  paymentSettings?: {
    requireUpfrontPayment: boolean;
    consultationFee?: number;
    appointmentFee?: number;
    serviceFee?: number;
    currency?: string;
  };

  @ApiPropertyOptional({
    description: 'Patient vitals (if applicable)',
    type: 'object'
  })
  publicVitals?: {
    bloodType?: string;
    heartRate?: number;
    bp?: string;
    temp?: string;
    spO2?: number;
    height?: string;
    weight?: string;
    bloodGroup?: string;
  };

  @ApiPropertyOptional({
    description: 'Patient specific ID (PT...)',
    example: 'PT123456789'
  })
  patientId?: string;
}

export class PublicUserSearchResponseDto {
  @ApiProperty({
    description: 'List of users found in search',
    type: [PublicUserSearchDto]
  })
  users: PublicUserSearchDto[];

  @ApiProperty({ description: 'Total number of users matching search criteria' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of users per page' })
  limit: number;

  @ApiProperty({ description: 'Whether there are more pages available' })
  hasMore: boolean;
}

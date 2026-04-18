import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Public center data for search results - excludes all sensitive information
 * This DTO ensures no personal data is exposed in discovery/search endpoints
 */
export class PublicCenterSearchDto {
  @ApiProperty({
    description: 'Public center identifier for search results',
    example: 'ctr_123456789'
  })
  publicId: string;

  @ApiProperty({
    description: 'Center UUID for API operations',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiProperty({
    description: 'Center name',
    example: 'General Hospital'
  })
  name: string;

  @ApiProperty({
    description: 'Center type',
    example: 'hospital'
  })
  type: string;

  @ApiProperty({
    description: 'Detailed center description',
    example: 'A leading healthcare facility providing comprehensive services.',
    required: false
  })
  description?: string;

  @ApiProperty({
    description: 'Official phone number for public inquiries',
    example: '+1234567890',
    required: false
  })
  phone?: string;

  @ApiProperty({
    description: 'Official email address for public enquiries',
    example: 'info@hospital.com',
    required: false
  })
  email?: string;

  @ApiProperty({
    description: 'Full address for navigation',
    example: '123 Main St, New York, NY 10001'
  })
  address: string;

  @ApiProperty({
    description: 'Latitude coordinate for mapping',
    example: 40.7128
  })
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate for mapping',
    example: -74.0060
  })
  longitude: number;

  @ApiProperty({
    description: 'General location information (city, state, country)',
    type: 'object',
    properties: {
      city: { type: 'string', example: 'New York' },
      state: { type: 'string', example: 'NY' },
      country: { type: 'string', example: 'United States' }
    }
  })
  generalLocation: {
    city: string;
    state: string;
    country: string;
  };

  @ApiProperty({
    description: 'Additional location metadata for enhanced mapping',
    required: false,
    example: { building: 'Main Building', floor: 'Ground Floor', entrance: 'Main Entrance' }
  })
  locationMetadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Business registration number',
    example: 'RC1234567',
    required: false
  })
  businessRegNumber?: string;

  @ApiProperty({
    description: 'Operating hours (general)',
    example: 'Monday-Friday: 9AM-5PM',
    required: false
  })
  hours?: string;

  @ApiProperty({
    description: 'Center rating (if available)',
    example: 4.2,
    required: false
  })
  rating?: number;

  @ApiProperty({
    description: 'Available services (general categories)',
    example: ['Emergency Care', 'Surgery', 'Cardiology'],
    required: false,
    type: [String]
  })
  serviceCategories?: string[];

  @ApiProperty({
    description: 'Whether the center is currently accepting new patients',
    example: true,
    required: false
  })
  acceptingNewPatients?: boolean;

  @ApiProperty({
    description: 'Center owner ID for job applications',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false
  })
  ownerId?: string;

  @ApiPropertyOptional({
    description: 'Detailed services offered by the center with pricing',
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
}

export class PublicCenterSearchResponseDto {
  @ApiProperty({
    description: 'List of centers found in search',
    type: [PublicCenterSearchDto]
  })
  centers: PublicCenterSearchDto[];

  @ApiProperty({ description: 'Total number of centers matching search criteria' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of centers per page' })
  limit: number;

  @ApiProperty({ description: 'Whether there are more pages available' })
  hasMore: boolean;
}

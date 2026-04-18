import { ApiProperty } from '@nestjs/swagger';

export class PublicUserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Display name' })
  name: string;

  @ApiProperty({ description: 'Medical specialty', required: false })
  specialty?: string;

  @ApiProperty({ description: 'Professional license expiry date', required: false })
  licenseExpiryDate?: Date;

  @ApiProperty({ description: 'Location information', required: false })
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };

  @ApiProperty({ description: 'User rating', required: false })
  rating?: number;

  @ApiProperty({ description: 'Availability information', required: false })
  availability?: {
    schedule: Record<string, { start: string; end: string }>;
    timezone: string;
  };

  @ApiProperty({ description: 'Profile avatar URL', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Professional qualifications', required: false })
  qualifications?: string[];

  @ApiProperty({ description: 'Years of experience', required: false })
  experience?: string;

  @ApiProperty({ description: 'Practice number', required: false })
  practiceNumber?: string;

  @ApiProperty({ description: 'Professional bio', required: false })
  bio?: string;

  @ApiProperty({ description: 'Professional practice details', required: false })
  professionalPractice?: {
    practiceName: string;
    practiceNumber: string;
    certifyingBody: string;
    issuanceDate: string;
    expiryDate?: string | null;
  };

  @ApiProperty({
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
    },
    required: false
  })
  services?: Array<{
    id?: string;
    name: string;
    description?: string;
    price?: number;
    currency?: string;
    category?: string;
  }>;

  @ApiProperty({ description: 'When the user joined the platform', required: false })
  joinedAt?: Date;

  @ApiProperty({ description: 'Professional phone number', required: false })
  phone?: string;

  @ApiProperty({
    description: 'Payment settings and accepted methods',
    required: false,
    type: 'object',
    properties: {
      requireUpfrontPayment: { type: 'boolean' },
      consultationFee: { type: 'number' },
      appointmentFee: { type: 'number' },
      serviceFee: { type: 'number' },
      currency: { type: 'string' },
      methods: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            label: { type: 'string' },
            details: { type: 'object' },
            instructions: { type: 'string' }
          }
        }
      }
    }
  })
  paymentSettings?: {
    requireUpfrontPayment: boolean;
    consultationFee?: number;
    appointmentFee?: number;
    serviceFee?: number;
    currency?: string;
    methods: Array<{
      type: 'paystack' | 'flutterwave' | 'stripe';
      label: string;
      details: {
        subaccount: string;
        [key: string]: any;
      };
      instructions?: string;
    }>;
  };
}

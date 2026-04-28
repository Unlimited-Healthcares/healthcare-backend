import { ApiProperty } from '@nestjs/swagger';

export class SafeUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User display ID', required: false })
  displayId?: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User roles' })
  roles: string[];

  @ApiProperty({ description: 'User active status' })
  isActive: boolean;

  @ApiProperty({
    description: 'User KYC status',
    enum: ['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NOT_STARTED',
  })
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiProperty({
    description: 'User professional verification status',
    enum: ['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NOT_STARTED',
  })
  professionalStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

  @ApiProperty({ description: 'User license expiry date', required: false })
  licenseExpiryDate?: Date;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'User profile information', required: false })
  profile?: {
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    phone?: string;
    avatar?: string;
    dateOfBirth?: Date;
    gender?: string;
    address?: string;
    bloodGroup?: string;
    genotype?: string;
    height?: number;
    weight?: number;
    specialization?: string;
    specialty?: string; // Alias for specialization
    practiceNumber?: string;
    governmentIdType?: string;
    governmentIdNumber?: string;
    governmentIdDoc?: string;
    experience?: string;
    services?: Array<{
      id?: string;
      name: string;
      description?: string;
      category?: string;
      price?: number;
      is_available?: boolean;
    }>;
    offeredServices?: Array<{
      id?: string;
      name: string;
      description?: string;
      category?: string;
      price?: number;
      is_available?: boolean;
    }>; // Alias for services
    certificates?: Array<{
      name: string;
      issuer: string;
      issueDate?: string;
      expiryDate?: string;
      url?: string;
    }>;
    qualifications?: string[];
    location?: {
      city?: string;
      state?: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
    availability?: {
      schedule?: Record<string, { start: string; end: string }>;
      timezone?: string;
    };
    privacySettings?: {
      profileVisibility?: 'public' | 'private' | 'professional_only';
      dataSharing?: Record<string, boolean>;
      contactPreferences?: Record<string, boolean>;
    };
    professionalPractice?: {
      practiceName?: string;
      practiceNumber?: string;
      certifyingBody?: string;
      issuanceDate?: string;
      expiryDate?: string | null;
    };
    businessRegistration?: {
      registrationNumber?: string;
      certificateName?: string;
      dateIssued?: string;
      expiryDate?: string | null;
    };
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
    createdAt: Date;
    updatedAt: Date;
  };
}

export class UserListResponseDto {
  @ApiProperty({ description: 'List of users', type: [SafeUserDto] })
  users: SafeUserDto[];

  @ApiProperty({ description: 'Total number of users' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of users per page' })
  limit: number;

  @ApiProperty({ description: 'Whether there are more pages' })
  hasMore: boolean;
}

import { ApiProperty } from '@nestjs/swagger';

export class SafeUserDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User roles' })
  roles: string[];

  @ApiProperty({ description: 'User active status' })
  isActive: boolean;

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
    specialization?: string;
    practiceNumber?: string;
    experience?: string;
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
    createdAt: Date;
    updatedAt: Date;
  };
}

export class RequestResponseDto {
  @ApiProperty({ description: 'Request ID' })
  id: string;

  @ApiProperty({ description: 'Sender user ID' })
  senderId: string;

  @ApiProperty({ description: 'Recipient user ID' })
  recipientId: string;

  @ApiProperty({ description: 'Request type' })
  requestType: string;

  @ApiProperty({ description: 'Request status' })
  status: string;

  @ApiProperty({ description: 'Request message', required: false })
  message?: string;

  @ApiProperty({ description: 'Request metadata', required: false })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Request creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Request response date', required: false })
  respondedAt?: Date;

  @ApiProperty({ description: 'Response message', required: false })
  responseMessage?: string;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Request last update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Sender user information', type: SafeUserDto })
  sender: SafeUserDto;

  @ApiProperty({ description: 'Recipient user information', type: SafeUserDto, required: false })
  recipient?: SafeUserDto;
}

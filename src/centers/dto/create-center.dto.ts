import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { CenterType } from '../enum/center-type.enum';

export class CreateCenterDto {
  @ApiProperty({ example: 'General Hospital', description: 'Center name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'hospital',
    description: 'Center type',
    enum: CenterType,
    enumName: 'CenterType'
  })
  @IsEnum(CenterType, { message: 'Invalid center type. Must be one of: hospital, pharmacy, clinic, laboratory, radiology, dental, eye, maternity, ambulance, virology, psychiatric, care-home, hospice, funeral' })
  @IsNotEmpty()
  type: CenterType;

  @ApiProperty({ example: '123 Main St, City, State', description: 'Center address' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: '123-456-7890', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'info@hospital.com', description: 'Email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '9:00 AM - 5:00 PM', description: 'Operating hours' })
  @IsString()
  @IsOptional()
  hours?: string;

  @ApiProperty({ example: 'RC1234567', description: 'Business registration number' })
  @IsString()
  @IsNotEmpty()
  businessRegNumber: string;

  @ApiPropertyOptional({ example: 'https://example.com/certificate.pdf', description: 'Business registration certificate URL' })
  @IsString()
  @IsOptional()
  businessRegCertificateUrl?: string;

  @ApiPropertyOptional({ example: 'New York', description: 'City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'NY', description: 'State/Province' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: 'USA', description: 'Country' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ example: '10001', description: 'ZIP/Postal code' })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiPropertyOptional({ example: 40.7128, description: 'Latitude' })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ example: -74.006, description: 'Longitude' })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ example: 'PRAC123456', description: 'Center practice number' })
  @IsString()
  @IsOptional()
  practiceNumber?: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Practice expiry date' })
  @IsString()
  @IsOptional()
  practiceExpiry?: string;

  @ApiPropertyOptional({
    description: 'Business registration details including number, certificate name, issue and expiry dates',
    type: 'object'
  })
  @IsOptional()
  businessRegistration?: {
    registrationNumber: string;
    certificateName: string;
    dateIssued: string;
    expiryDate?: string | null;
  };

  @ApiPropertyOptional({
    description: 'Payment settings and fee information',
    type: 'object'
  })
  @IsOptional()
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


// Deployment trigger: 2026-03-04
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsObject, IsNumber, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceDto {
  @ApiPropertyOptional({ example: 'serv_123' })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiPropertyOptional({ example: 'Consultation' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'General medical consultation' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'General' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 50.0 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_available?: boolean;
}

export class CertificateDto {
  @ApiPropertyOptional({ example: 'AWS Specialist' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Amazon' })
  @IsString()
  issuer: string;

  @ApiPropertyOptional({ example: '2023-01-01' })
  @IsString()
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  url?: string;
}

export class CreateProfileDto {
  @ApiPropertyOptional({ example: 'John', description: 'First name' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Dr. John Doe', description: 'Display name' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ example: '123-456-7890', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL' })
  @IsString()
  @IsOptional()
  avatar?: string;

  @ApiPropertyOptional({ example: '1990-01-01', description: 'Date of birth' })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'male', description: 'Gender' })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiPropertyOptional({ example: '123 Main St, City, State', description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'O+', description: 'Blood group' })
  @IsString()
  @IsOptional()
  bloodGroup?: string;

  @ApiPropertyOptional({ example: 'AA', description: 'Genotype' })
  @IsString()
  @IsOptional()
  genotype?: string;

  @ApiPropertyOptional({ example: 175.5, description: 'Height in centimeters' })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ example: 72.3, description: 'Weight in kilograms' })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ example: 'Cardiology', description: 'Medical specialization' })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional({ example: 'MD123456', description: 'Professional practice number' })
  @IsString()
  @IsOptional()
  practiceNumber?: string;

  @ApiPropertyOptional({ example: 'National Identity Card (NIN)', description: 'Type of government-issued ID' })
  @IsString()
  @IsOptional()
  governmentIdType?: string;

  @ApiPropertyOptional({ example: '12345678901', description: 'Government-issued ID number' })
  @IsString()
  @IsOptional()
  governmentIdNumber?: string;

  @ApiPropertyOptional({ example: 'data:image/jpeg;base64,...', description: 'Base64-encoded ID card photo or scan (uploaded directly from device)' })
  @IsString()
  @IsOptional()
  governmentIdDoc?: string;

  @ApiPropertyOptional({ example: '5 years', description: 'Years of experience' })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({
    example: { city: 'New York', state: 'New York', country: 'United States', postalCode: '10001' },
    description: 'Location information'
  })
  @IsObject()
  @IsOptional()
  location?: {
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number };
  };

  @ApiPropertyOptional({
    example: {
      practiceName: 'MBBS Certificate',
      practiceNumber: 'MDCN/2020/12345',
      certifyingBody: 'Medical and Dental Council of Nigeria',
      issuanceDate: '2020-01-15',
      expiryDate: '2025-01-15',
    },
    description: 'Professional practice details for doctors/nurses'
  })
  @IsObject()
  @IsOptional()
  professionalPractice?: {
    practiceName: string;
    practiceNumber: string;
    certifyingBody: string;
    issuanceDate: string;
    expiryDate?: string | null;
  };

  @ApiPropertyOptional({
    example: {
      registrationNumber: 'RC-123456',
      certificateName: 'CAC Business Registration',
      dateIssued: '2019-06-01',
      expiryDate: null,
    },
    description: 'Business registration details for health centers/facilities'
  })
  @IsObject()
  @IsOptional()
  businessRegistration?: {
    registrationNumber: string;
    certificateName: string;
    dateIssued: string;
    expiryDate?: string | null;
  };

  @ApiPropertyOptional({
    example: {
      jobTitle: 'Registered Nurse',
      department: 'Emergency',
      employeeId: 'EMP-00123',
      employmentStartDate: '2023-01-15',
      emergencyContact: { name: 'Jane Doe', phone: '+2348012345678', relationship: 'Spouse' }
    },
    description: 'Employment details for staff members'
  })
  @IsObject()
  @IsOptional()
  staffInfo?: {
    jobTitle?: string;
    department?: string;
    employeeId?: string;
    employmentStartDate?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Alias for practiceNumber (sent from frontend forms)',
    example: 'NCN123456'
  })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({
    description: 'Services offered by the healthcare professional (nurses, etc.)',
    type: [ServiceDto],
    example: [{ name: 'Wound Dressing', category: 'Wound Care', is_available: true }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  @IsOptional()
  services?: ServiceDto[];

  @ApiPropertyOptional({
    description: 'Payment settings including fees and methods',
    example: {
      requireUpfrontPayment: true,
      consultationFee: 50,
      appointmentFee: 30,
      currency: 'USD',
      methods: [{ type: 'paystack', label: 'Online Payment' }]
    }
  })
  @IsObject()
  @IsOptional()
  paymentSettings?: {
    requireUpfrontPayment?: boolean;
    consultationFee?: number;
    appointmentFee?: number;
    serviceFee?: number;
    currency?: string;
    methods?: Array<{
      type: 'paystack' | 'flutterwave';
      label: string;
      details: {
        subaccount: string;
        [key: string]: unknown;
      };
      instructions?: string;
    }>;
  };

  @ApiPropertyOptional({
    description: 'Professional certificates',
    type: [CertificateDto],
    example: [{ name: 'Certified Specialist', issuer: 'Medical Board' }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CertificateDto)
  @IsOptional()
  certificates?: CertificateDto[];

  @ApiPropertyOptional({
    description: 'User preferences (notifications, UI settings, legacy preferences)',
    example: { notifications: true, emailUpdates: true, smsUpdates: false, language: 'en', timezone: 'UTC' }
  })
  @IsObject()
  @IsOptional()
  preferences?: {
    notifications?: boolean;
    emailUpdates?: boolean;
    smsUpdates?: boolean;
    pushNotifications?: boolean;
    profileVisibility?: boolean;
    language?: string;
    timezone?: string;
  };

  @ApiPropertyOptional({
    description: 'Professional license expiry date',
    example: '2025-12-31'
  })
  @IsString()
  @IsOptional()
  licenseExpiryDate?: string;

  // Frontend Aliases (to ensure they survive ValidationPipe whitelist)
  @ApiPropertyOptional({ description: 'Alias for specialization' })
  @IsString()
  @IsOptional()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Alias for services' })
  @IsArray()
  @IsOptional()
  offeredServices?: any[];
}


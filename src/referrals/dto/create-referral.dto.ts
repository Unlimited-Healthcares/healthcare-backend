import { IsString, IsUUID, IsOptional, IsEnum, IsDate, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReferralType, ReferralPriority } from '../entities/referral.entity';

interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  [key: string]: unknown;
}

interface AllergyInfo {
  allergen: string;
  reaction: string;
  severity: string;
  [key: string]: unknown;
}

export class CreateReferralDto {
  @ApiProperty({ description: 'Patient ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Referring center ID', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsUUID()
  referringCenterId: string;

  @ApiProperty({ description: 'Receiving center ID', example: '123e4567-e89b-12d3-a456-426614174002' })
  @IsUUID()
  receivingCenterId: string;

  @ApiProperty({ 
    description: 'Receiving provider ID (optional)', 
    example: '123e4567-e89b-12d3-a456-426614174003',
    required: false
  })
  @IsOptional()
  @IsUUID()
  receivingProviderId?: string;

  @ApiProperty({ 
    description: 'Type of referral', 
    enum: ReferralType,
    example: ReferralType.SPECIALIST,
    default: ReferralType.SPECIALIST
  })
  @IsEnum(ReferralType)
  referralType: ReferralType;

  @ApiProperty({ 
    description: 'Priority level of the referral', 
    enum: ReferralPriority,
    example: ReferralPriority.NORMAL,
    default: ReferralPriority.NORMAL
  })
  @IsEnum(ReferralPriority)
  @IsOptional()
  priority?: ReferralPriority;

  @ApiProperty({ description: 'Reason for the referral', example: 'Specialist consultation for diabetes management' })
  @IsString()
  reason: string;

  @ApiProperty({ 
    description: 'Clinical notes about the patient condition', 
    example: 'Patient has uncontrolled Type 2 diabetes with recent HbA1c of 9.2%',
    required: false
  })
  @IsString()
  @IsOptional()
  clinicalNotes?: string;

  @ApiProperty({ 
    description: 'Diagnosis related to the referral', 
    example: 'Type 2 Diabetes Mellitus (E11.9)',
    required: false
  })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiProperty({ 
    description: 'Instructions for the receiving provider', 
    example: 'Please evaluate for insulin therapy and provide nutritional guidance',
    required: false
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiProperty({ 
    description: 'When the referral should be scheduled by', 
    example: '2023-10-15',
    required: false
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  scheduledDate?: Date;

  @ApiProperty({ 
    description: 'Expiration date for the referral', 
    example: '2023-12-31',
    required: false
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expirationDate?: Date;

  @ApiProperty({ 
    description: 'Additional metadata about the referral', 
    example: { 'urgencyScore': 7, 'insuranceVerified': true },
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({ 
    description: 'Medications the patient is currently taking', 
    example: [
      { name: 'Metformin', dosage: '1000mg', frequency: 'BID' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'daily' }
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  medications?: MedicationInfo[];

  @ApiProperty({ 
    description: 'Patient allergies', 
    example: [
      { allergen: 'Penicillin', reaction: 'Rash', severity: 'Moderate' },
      { allergen: 'Sulfa drugs', reaction: 'Anaphylaxis', severity: 'Severe' }
    ],
    required: false
  })
  @IsOptional()
  @IsArray()
  allergies?: AllergyInfo[];

  @ApiProperty({ 
    description: 'Patient medical history relevant to the referral', 
    example: 'History of hypertension and hyperlipidemia. Family history of cardiovascular disease.',
    required: false
  })
  @IsString()
  @IsOptional()
  medicalHistory?: string;
} 
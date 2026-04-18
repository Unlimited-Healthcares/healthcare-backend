
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreatePatientDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  medicalRecordNumber?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string;

  @IsOptional()
  @IsString()
  bloodType?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  chronicConditions?: string;

  @IsOptional()
  @IsString()
  currentMedications?: string;

  @IsOptional()
  @IsString()
  insuranceProvider?: string;

  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @IsOptional()
  @IsBoolean()
  consentDataSharing?: boolean;

  @IsOptional()
  @IsBoolean()
  consentResearch?: boolean;

  @IsOptional()
  @IsBoolean()
  consentMarketing?: boolean;
}

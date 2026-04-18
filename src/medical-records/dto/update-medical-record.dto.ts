import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateMedicalRecordDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  recordType?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsOptional()
  metadata?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isSensitive?: boolean;

  @IsBoolean()
  @IsOptional()
  isShareable?: boolean;

  @IsOptional()
  sharingRestrictions?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  diagnosis?: string;

  @IsString()
  @IsOptional()
  treatment?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  followUp?: string;

  @IsOptional()
  medications?: Record<string, unknown> | unknown[];

  @IsOptional()
  changesSummary?: string;

  @IsOptional()
  vitals?: Record<string, unknown>;
}

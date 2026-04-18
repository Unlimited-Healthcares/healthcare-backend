import { IsOptional, IsEnum, IsString, IsNumber, IsArray, IsObject, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { VerificationRequestType, VerificationStatus } from '../entities/center-verification-request.entity';
import { JsonObject } from '../../types/common';

export class CreateCenterVerificationRequestDto {
  @IsString()
  centerId: string;

  @IsEnum(VerificationRequestType)
  @IsOptional()
  requestType?: VerificationRequestType;

  @IsArray()
  @IsOptional()
  verificationDocuments?: JsonObject[];

  @IsOptional()
  @IsObject()
  complianceChecklist?: JsonObject;

  @IsOptional()
  @IsObject()
  metadata?: JsonObject;

  @IsOptional()
  @IsObject()
  documentsMetadata?: JsonObject;
}

export class UpdateCenterVerificationRequestDto {
  @IsEnum(VerificationStatus)
  @IsOptional()
  status?: VerificationStatus;

  @IsString()
  @IsOptional()
  reviewerNotes?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  complianceScore?: number;

  @IsOptional()
  nextReviewDate?: Date;

  @IsArray()
  @IsOptional()
  verificationDocuments?: JsonObject[];

  @IsOptional()
  @IsObject()
  documentsMetadata?: JsonObject;

  @IsOptional()
  @IsObject()
  complianceChecklist?: JsonObject;
}

export class CenterVerificationFiltersDto {
  @IsEnum(VerificationStatus)
  @IsOptional()
  status?: VerificationStatus;

  @IsEnum(VerificationRequestType)
  @IsOptional()
  requestType?: VerificationRequestType;

  @IsString()
  @IsOptional()
  centerId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

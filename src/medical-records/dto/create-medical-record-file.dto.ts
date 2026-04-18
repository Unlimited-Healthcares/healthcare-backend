import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalRecordFileDto {
  @IsString()
  @IsNotEmpty()
  recordId: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsString()
  @IsNotEmpty()
  originalFileName: string;

  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsString()
  @IsNotEmpty()
  fileType: string;

  @IsNumber()
  fileSize: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsBoolean()
  @IsOptional()
  isEncrypted?: boolean;

  @IsString()
  @IsOptional()
  encryptionKeyId?: string;

  @IsString()
  @IsOptional()
  thumbnailPath?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'File metadata',
    required: false 
  })
  metadata?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  uploadStatus?: string;

  @IsString()
  @IsNotEmpty()
  createdBy: string;
}

import { IsString, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Case #442 - Post-Op Recovery' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Unified room for post-operative care monitoring' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'patient-uuid' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ example: 'encounter-uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ example: 'dicom-study-uuid' })
  @IsOptional()
  @IsUUID()
  dicomStudyId?: string;
}

export class CreateLogEntryDto {
  @ApiProperty({ example: 'Patient stable, vitals normal during morning rounds.' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isSystemGenerated?: boolean;
}

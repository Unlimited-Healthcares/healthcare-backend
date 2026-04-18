import { IsString, IsOptional, IsUUID, IsDateString, IsBoolean } from 'class-validator';

export class CreateImagingStudyDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  studyDate?: string;

  @IsOptional()
  @IsString()
  modality?: string;

  @IsOptional()
  @IsString()
  bodyPart?: string;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;
}


import { IsString, IsOptional, IsBoolean, IsUUID, IsDateString } from 'class-validator';

export class CreatePatientVisitDto {
  @IsUUID()
  centerId: string;

  @IsDateString()
  visitDate: string;

  @IsString()
  visitType: string;

  @IsOptional()
  @IsString()
  chiefComplaint?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  treatmentNotes?: string;

  @IsOptional()
  @IsString()
  prescribedMedications?: string;

  @IsOptional()
  @IsBoolean()
  followUpRequired?: boolean;

  @IsOptional()
  @IsDateString()
  followUpDate?: string;

  @IsOptional()
  @IsString()
  visitStatus?: string;
}

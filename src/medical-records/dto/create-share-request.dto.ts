
import { IsString, IsOptional, IsUUID, IsInt, IsIn } from 'class-validator';

export class CreateShareRequestDto {
  @IsUUID()
  recordId: string;

  @IsUUID()
  patientId: string;

  @IsUUID()
  requestingCenterId: string;

  @IsUUID()
  owningCenterId: string;

  @IsString()
  purpose: string;

  @IsOptional()
  @IsIn(['urgent', 'normal', 'low'])
  urgencyLevel?: string;

  @IsOptional()
  @IsIn(['view', 'download', 'edit'])
  requestedAccessLevel?: string;

  @IsOptional()
  @IsInt()
  requestedDurationDays?: number;
}

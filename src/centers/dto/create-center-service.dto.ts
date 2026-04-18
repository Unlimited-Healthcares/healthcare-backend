
import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID } from 'class-validator';

export class CreateCenterServiceDto {
  @IsUUID()
  centerId: string;

  @IsString()
  serviceName: string;

  @IsOptional()
  @IsString()
  serviceCategory?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsBoolean()
  isEmergencyService?: boolean;

  @IsOptional()
  @IsBoolean()
  requiresAppointment?: boolean;
}

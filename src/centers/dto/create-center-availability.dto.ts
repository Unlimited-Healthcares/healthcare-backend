
import { IsNumber, IsString, IsOptional, IsBoolean, IsUUID, Min, Max } from 'class-validator';

export class CreateCenterAvailabilityDto {
  @IsUUID()
  centerId: string;

  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0=Sunday, 6=Saturday

  @IsString()
  openTime: string; // HH:MM format

  @IsString()
  closeTime: string; // HH:MM format

  @IsOptional()
  @IsBoolean()
  isEmergencyHours?: boolean;

  @IsOptional()
  @IsString()
  breakStartTime?: string;

  @IsOptional()
  @IsString()
  breakEndTime?: string;
}

import { IsUUID, IsInt, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProviderAvailabilityDto {
  @IsUUID()
  providerId: string;

  @IsUUID()
  centerId: string;

  @IsInt()
  @Type(() => Number)
  dayOfWeek: number; // 0-6, Sunday to Saturday

  @IsString()
  startTime: string; // HH:MM format

  @IsString()
  endTime: string; // HH:MM format

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  breakStartTime?: string;

  @IsOptional()
  @IsString()
  breakEndTime?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  maxAppointmentsPerSlot?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  slotDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  bufferTimeMinutes?: number;

  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;

  @IsOptional()
  @IsDateString()
  effectiveUntil?: string;
}

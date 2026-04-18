
import { IsString, IsOptional, IsBoolean, IsDateString, ValidateNested, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class RecurrencePatternDto {
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly', 'yearly'])
  frequency: string;

  @IsNumber()
  interval: number;

  @IsOptional()
  @IsString({ each: true })
  daysOfWeek?: string[];

  @IsOptional()
  @IsNumber()
  dayOfMonth?: number;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  occurrences?: number;
}

export class CreateRecurringAppointmentDto {
  @IsString()
  patientId: string;

  @IsString()
  centerId: string;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  appointmentTypeId?: string;

  @IsDateString()
  appointmentDate: string;

  @IsOptional()
  @IsNumber()
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  doctor: string;

  @IsBoolean()
  isRecurring: boolean;

  @ValidateNested()
  @Type(() => RecurrencePatternDto)
  recurrencePattern: RecurrencePatternDto;
}

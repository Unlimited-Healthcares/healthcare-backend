import { IsUUID, IsDateString, IsString, IsOptional, IsInt, IsIn, IsBoolean, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @IsUUID()
  @ApiProperty({ description: 'Patient ID' })
  patientId: string;

  @IsUUID()
  @ApiProperty({ description: 'Center ID' })
  centerId: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ description: 'Provider ID', required: false })
  providerId?: string;

  @IsOptional()
  @IsUUID()
  @ApiProperty({ description: 'Appointment type ID', required: false })
  appointmentTypeId?: string;

  @IsDateString()
  @ApiProperty({ description: 'Appointment date and time', example: '2025-05-26T09:00:00Z' })
  appointmentDate: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiProperty({ description: 'Duration of appointment in minutes', default: 30, required: false })
  durationMinutes?: number;

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  @ApiProperty({ 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal', 
    description: 'Priority of the appointment',
    required: false
  })
  priority?: string;

  @IsString()
  @ApiProperty({ description: 'Reason for the appointment' })
  reason: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Additional notes', required: false })
  notes?: string;

  @IsString()
  @ApiProperty({ description: 'Doctor name', example: 'Dr. John Smith' })
  doctor: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: 'Whether this is a recurring appointment', default: false, required: false })
  isRecurring?: boolean;

  @IsOptional()
  @ApiProperty({ 
    description: 'Recurrence pattern for recurring appointments', 
    required: false,
    example: {
      frequency: 'weekly',
      interval: 2,
      count: 10
    }
  })
  recurrencePattern?: {
    frequency?: string;
    interval?: number;
    count?: number;
    endDate?: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
    occurrences?: number;
  };

  @IsOptional()
  @IsObject()
  @ApiProperty({
    required: false,
    description: 'Additional metadata for the appointment. Can include fields like preparation instructions, reminder preferences, etc.',
    example: {
      preparation: "Patient should fast for 8 hours before the appointment",
      reminderPreferences: {
        emailEnabled: true,
        smsEnabled: false,
        reminderTiming: [24, 2]
      }
    }
  })
  metadata?: Record<string, unknown>;
}

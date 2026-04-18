import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsOptional, IsIn, IsString, IsDateString, IsObject } from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
  @IsOptional()
  @IsIn(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'])
  @ApiProperty({
    enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
    required: false,
    description: 'The status of the appointment'
  })
  appointmentStatus?: string;

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'declined'])
  @ApiProperty({
    enum: ['pending', 'confirmed', 'declined'],
    required: false,
    description: 'The confirmation status of the appointment'
  })
  confirmationStatus?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Reason for cancellation if the appointment is cancelled'
  })
  cancellationReason?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    required: false,
    description: 'Date when the appointment was confirmed',
    format: 'date-time'
  })
  confirmedAt?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    required: false,
    description: 'Additional metadata for the appointment. Can include fields like preparation instructions, reminder preferences, etc.',
    example: {
      preparation: "Patient should fast for 8 hours before the appointment",
      reminderPreferences: {
        emailEnabled: true,
        smsEnabled: false
      }
    }
  })
  metadata?: Record<string, unknown>;
}


import { IsString, IsDateString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDonationAppointmentDto {
  @ApiProperty({ example: 'donor-uuid', description: 'Donor ID' })
  @IsString()
  donorId: string;

  @ApiProperty({ example: 'center-uuid', description: 'Center ID' })
  @IsString()
  centerId: string;

  @ApiProperty({ example: '2024-02-15T10:00:00Z', description: 'Appointment date and time' })
  @IsDateString()
  appointmentDate: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes', required: false })
  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(180)
  durationMinutes?: number;

  @ApiProperty({ example: 'staff-uuid', description: 'Assigned staff member', required: false })
  @IsOptional()
  @IsString()
  staffAssigned?: string;

  @ApiProperty({ example: 'First-time donor', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

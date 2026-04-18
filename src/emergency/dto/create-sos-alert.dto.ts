import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AlertType } from '../entities/emergency-alert.entity';
import { EmergencyMedicalData } from '../entities/emergency-medical-data.entity';

export class CreateSOSAlertDto {
  @ApiProperty({ description: 'Alert type', enum: AlertType })
  @IsEnum(AlertType)
  type: AlertType;

  @ApiProperty({ description: 'Alert description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Location latitude' })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Location longitude' })
  @IsNumber()
  longitude: number;

  @ApiProperty({ description: 'Location address', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Contact phone number' })
  @IsString()
  contactNumber: string;

  @ApiProperty({ description: 'Patient ID', required: false })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiProperty({ description: 'Medical information', required: false })
  @IsOptional()
  medicalInfo?: EmergencyMedicalData;

  @ApiProperty({ description: 'Is this a test alert', required: false })
  @IsOptional()
  @IsBoolean()
  isTestAlert?: boolean;
}

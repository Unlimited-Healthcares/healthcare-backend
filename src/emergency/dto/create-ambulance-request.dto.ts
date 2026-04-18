import { IsString, IsNumber, IsOptional, IsEnum, IsPhoneNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Priority } from '../entities/ambulance-request.entity';
import { EmergencyMedicalData } from '../entities/emergency-medical-data.entity';
import { JsonObject } from 'type-fest';

export class CreateAmbulanceRequestDto {
  @ApiProperty({ description: 'Patient name' })
  @IsString()
  patientName: string;

  @ApiProperty({ description: 'Patient age', required: false })
  @IsOptional()
  @IsNumber()
  patientAge?: number;

  @ApiProperty({ description: 'Patient gender', required: false })
  @IsOptional()
  @IsString()
  patientGender?: string;

  @ApiProperty({ description: 'Patient phone number' })
  @IsPhoneNumber()
  patientPhone: string;

  @ApiProperty({ description: 'Emergency contact name', required: false })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiProperty({ description: 'Emergency contact phone', required: false })
  @IsOptional()
  @IsPhoneNumber()
  emergencyContactPhone?: string;

  @ApiProperty({ description: 'Pickup latitude' })
  @IsNumber()
  pickupLatitude: number;

  @ApiProperty({ description: 'Pickup longitude' })
  @IsNumber()
  pickupLongitude: number;

  @ApiProperty({ description: 'Pickup address' })
  @IsString()
  pickupAddress: string;

  @ApiProperty({ description: 'Destination latitude', required: false })
  @IsOptional()
  @IsNumber()
  destinationLatitude?: number;

  @ApiProperty({ description: 'Destination longitude', required: false })
  @IsOptional()
  @IsNumber()
  destinationLongitude?: number;

  @ApiProperty({ description: 'Destination address', required: false })
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  @ApiProperty({ description: 'Medical condition description' })
  @IsString()
  medicalCondition: string;

  @ApiProperty({ description: 'Symptoms description', required: false })
  @IsOptional()
  @IsString()
  symptoms?: string;

  @ApiProperty({ description: 'Priority level', enum: Priority })
  @IsEnum(Priority)
  priority: Priority;

  @ApiProperty({ description: 'Special requirements', required: false })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiProperty({ description: 'Patient medical history', required: false })
  @IsOptional()
  medicalHistory?: EmergencyMedicalData;

  @ApiProperty({ description: 'Insurance information', required: false })
  @IsOptional()
  insuranceInfo?: JsonObject;
}

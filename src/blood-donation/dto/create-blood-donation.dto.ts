import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsDateString, IsObject, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodType } from '../enums/blood-type.enum';
import { BloodDonationData } from '../../types/medical.types';
import { JsonObject } from '../../types/common.types';

export class CreateBloodDonationDto {
  @ApiProperty({ example: 'donor-uuid', description: 'Donor ID' })
  @IsString()
  @IsNotEmpty()
  donorId: string;

  @ApiProperty({ example: 'request-uuid', description: 'Request ID (optional)', required: false })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiProperty({ example: 'center-uuid', description: 'Blood bank center ID' })
  @IsString()
  bloodBankCenterId: string;

  @ApiProperty({ example: '2024-02-15T10:00:00Z', description: 'Donation date' })
  @IsDateString()
  donationDate: string;

  @ApiProperty({ example: 'A+', enum: BloodType })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiProperty({ example: 450, description: 'Volume in milliliters' })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(500)
  volumeMl?: number;

  @ApiProperty({ example: { bloodPressure: '120/80', pulse: 72 }, required: false })
  @IsOptional()
  @IsObject()
  preDonationVitals?: Record<string, string | number>;

  @ApiProperty({ example: { bloodPressure: '115/75', pulse: 75 }, required: false })
  @IsOptional()
  @IsObject()
  postDonationVitals?: Record<string, string | number>;

  @ApiProperty({ example: { hemoglobin: 14.5, hematocrit: 42 }, required: false })
  @IsOptional()
  @IsObject()
  screeningResults?: Record<string, string | number>;

  @ApiProperty({ example: 'Donation completed successfully', required: false })
  @IsOptional()
  @IsString()
  staffNotes?: string;

  @ApiProperty({ example: 50.00, description: 'Compensation amount', required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  compensationAmount?: number;

  @ApiProperty({ description: 'Pre-donation screening results', required: false })
  @IsOptional()
  preScreeningResults?: BloodDonationData['healthScreening'];

  @ApiProperty({ description: 'Post-donation monitoring data', required: false })
  @IsOptional()
  postDonationMonitoring?: JsonObject;

  @ApiProperty({ description: 'Additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

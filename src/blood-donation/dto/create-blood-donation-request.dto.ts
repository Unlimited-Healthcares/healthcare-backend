import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodType } from '../enums/blood-type.enum';
import { RequestPriority } from '../entities/blood-donation-request.entity';

export class CreateBloodDonationRequestDto {
  @ApiProperty({ example: 'center-uuid', description: 'Requesting center ID' })
  @IsString()
  requestingCenterId: string;

  @ApiProperty({ example: 'Jane Doe', required: false })
  @IsOptional()
  @IsString()
  patientName?: string;

  @ApiProperty({ example: 35, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(150)
  patientAge?: number;

  @ApiProperty({ example: 'A+', enum: BloodType })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiProperty({ example: 2, description: 'Number of units needed' })
  @IsNumber()
  @Min(1)
  @Max(20)
  unitsNeeded: number;

  @ApiProperty({ example: 'high', enum: RequestPriority })
  @IsEnum(RequestPriority)
  priority: RequestPriority;

  @ApiProperty({ example: '2024-02-15T10:00:00Z', description: 'When blood is needed by' })
  @IsDateString()
  neededBy: string;

  @ApiProperty({ example: 'Surgery - blood loss', required: false })
  @IsOptional()
  @IsString()
  medicalCondition?: string;

  @ApiProperty({ example: 'CMV negative required', required: false })
  @IsOptional()
  @IsString()
  specialRequirements?: string;

  @ApiProperty({ example: 'Dr. Smith', required: false })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiProperty({ example: 'Urgent case - car accident', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

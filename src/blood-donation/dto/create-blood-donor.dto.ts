import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, IsArray, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BloodType } from '../enums/blood-type.enum';

export class CreateBloodDonorDto {
  @ApiProperty({ example: 'A+', enum: BloodType })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiProperty({ example: 70.5, description: 'Weight in kilograms' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(40)
  @Max(200)
  weightKg?: number;

  @ApiProperty({ example: 175, description: 'Height in centimeters' })
  @IsOptional()
  @IsNumber()
  @Min(120)
  @Max(250)
  heightCm?: number;

  @ApiProperty({ example: '1990-01-15', description: 'Date of birth' })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({ example: 'John Smith', required: false })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiProperty({ example: ['diabetes', 'hypertension'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medicalConditions?: string[];

  @ApiProperty({ example: ['aspirin', 'metformin'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  medications?: string[];

  @ApiProperty({ example: 'No additional notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

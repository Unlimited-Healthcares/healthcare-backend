import { IsString, IsNumber, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ViralReportType } from '../entities/viral-report.entity';
import { JsonObject } from 'type-fest';

export class CreateViralReportDto {
  @ApiProperty({ description: 'Report type', enum: ViralReportType })
  @IsEnum(ViralReportType)
  type: ViralReportType;

  @ApiProperty({ description: 'Submit anonymously', required: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiProperty({ description: 'Disease type' })
  @IsString()
  diseaseType: string;

  @ApiProperty({ description: 'List of symptoms' })
  @IsArray()
  @IsString({ each: true })
  symptoms: string[];

  @ApiProperty({ description: 'Symptom onset date', required: false })
  @IsOptional()
  @IsDateString()
  onsetDate?: Date;

  @ApiProperty({ description: 'Exposure date', required: false })
  @IsOptional()
  @IsDateString()
  exposureDate?: Date;

  @ApiProperty({ description: 'Location latitude', required: false })
  @IsOptional()
  @IsNumber()
  locationLatitude?: number;

  @ApiProperty({ description: 'Location longitude', required: false })
  @IsOptional()
  @IsNumber()
  locationLongitude?: number;

  @ApiProperty({ description: 'Location address', required: false })
  @IsOptional()
  @IsString()
  locationAddress?: string;

  @ApiProperty({ description: 'Contact information', required: false })
  @IsOptional()
  contactInformation?: JsonObject;

  @ApiProperty({ description: 'Number of affected people', required: false })
  @IsOptional()
  @IsNumber()
  affectedCount?: number;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Risk factors', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  riskFactors?: string[];

  @ApiProperty({ description: 'Preventive measures taken', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preventiveMeasures?: string[];

  @ApiProperty({ description: 'Healthcare facility visited', required: false })
  @IsOptional()
  @IsString()
  healthcareFacilityVisited?: string;

  @ApiProperty({ description: 'Test results', required: false })
  @IsOptional()
  testResults?: JsonObject;
}

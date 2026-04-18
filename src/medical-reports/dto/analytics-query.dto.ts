import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsEnum, IsArray, IsString, IsBoolean } from 'class-validator';

export enum AnalyticsTimeFrame {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly'
}

export enum AnalyticsEntityType {
  MEDICAL_RECORDS = 'medical_records',
  REFERRALS = 'referrals',
  APPOINTMENTS = 'appointments',
  ALL = 'all'
}

export class AnalyticsQueryDto {
  @ApiProperty({
    description: 'Center ID for filtering analytics by healthcare center',
    required: true
  })
  @IsUUID()
  centerId: string;
  
  @ApiProperty({
    description: 'Start date for the analytics period',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;
  
  @ApiProperty({
    description: 'End date for the analytics period',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
  
  @ApiProperty({
    description: 'Time frame for aggregating results',
    enum: AnalyticsTimeFrame,
    default: AnalyticsTimeFrame.MONTHLY,
    required: false
  })
  @IsOptional()
  @IsEnum(AnalyticsTimeFrame)
  timeFrame?: AnalyticsTimeFrame = AnalyticsTimeFrame.MONTHLY;
  
  @ApiProperty({
    description: 'Type of entities to include in analytics',
    enum: AnalyticsEntityType,
    default: AnalyticsEntityType.ALL,
    required: false
  })
  @IsOptional()
  @IsEnum(AnalyticsEntityType)
  entityType?: AnalyticsEntityType = AnalyticsEntityType.ALL;
  
  @ApiProperty({
    description: 'Provider IDs to filter by',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  providerIds?: string[];
  
  @ApiProperty({
    description: 'Patient IDs to filter by',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  patientIds?: string[];
  
  @ApiProperty({
    description: 'Types of medical records to include (e.g., diagnosis, prescription)',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recordTypes?: string[];
  
  @ApiProperty({
    description: 'Whether to include trend analysis',
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  includeTrends?: boolean = false;
  
  @ApiProperty({
    description: 'Whether to include comparison with previous period',
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  includeComparison?: boolean = false;
} 
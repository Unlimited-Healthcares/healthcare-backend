
import { IsString, IsOptional, IsBoolean, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DateRangeDto {
  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;
}

export class GenerateReportDto {
  @IsString()
  patientId: string;

  @IsOptional()
  @IsString()
  reportType?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => DateRangeDto)
  dateRange?: DateRangeDto;

  @IsOptional()
  @IsBoolean()
  includeFiles?: boolean;

  @IsOptional()
  @IsString()
  format?: 'pdf' | 'html';
}

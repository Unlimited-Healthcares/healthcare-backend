
import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class ExportReportDto {
  @IsString()
  reportId: string;

  @IsString()
  @IsIn(['csv', 'pdf', 'excel'])
  format: string;

  @IsOptional()
  @IsBoolean()
  includeAttachments?: boolean;

  @IsOptional()
  @IsString()
  centerId?: string;
}

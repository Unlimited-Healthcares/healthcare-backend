import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FileUploadDto {
  @IsString()
  recordId: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'File metadata',
    required: false 
  })
  metadata?: Record<string, unknown>;
}

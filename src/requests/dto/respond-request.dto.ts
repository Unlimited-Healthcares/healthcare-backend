import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RespondRequestDto {
  @ApiProperty({ 
    description: 'Response action',
    enum: ['approve', 'reject']
  })
  @IsString()
  @IsIn(['approve', 'reject'])
  action: string;

  @ApiPropertyOptional({ description: 'Response message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Response metadata (e.g., fee, date, time)' })
  @IsOptional()
  metadata?: Record<string, any>;
}

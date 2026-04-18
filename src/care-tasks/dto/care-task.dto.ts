import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCareTaskDto {
  @ApiProperty({ description: 'Patient ID' })
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @ApiPropertyOptional({ description: 'Assigned staff User ID' })
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({ description: 'Task title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Due date and time' })
  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @ApiPropertyOptional({ description: 'Task priority', enum: ['low', 'medium', 'high', 'urgent'] })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateCareTaskDto {
  @ApiPropertyOptional({ enum: ['pending', 'in_progress', 'completed', 'cancelled'] })
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  @IsOptional()
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @ApiPropertyOptional({ enum: ['low', 'medium', 'high', 'urgent'] })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: 'low' | 'medium' | 'high' | 'urgent';
}

import { IsString, IsOptional, IsEnum, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JsonObject } from 'type-fest';

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, how are you feeling today?' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ example: 'text', enum: ['text', 'file', 'image', 'video', 'audio', 'system'] })
  @IsOptional()
  @IsEnum(['text', 'file', 'image', 'video', 'audio', 'system', 'video_call_start', 'video_call_end'])
  messageType?: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system' | 'video_call_start' | 'video_call_end';

  @ApiPropertyOptional({ example: 'https://example.com/file.pdf' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiPropertyOptional({ example: 'document.pdf' })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({ example: 1024000 })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({ example: 'application/pdf' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ example: 'message-uuid' })
  @IsOptional()
  @IsUUID()
  replyToMessageId?: string;

  @ApiProperty({ 
    description: 'Message metadata',
    required: false,
    type: 'object'
  })
  @IsOptional()
  messageMetadata?: JsonObject;
}

import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JsonObject } from 'type-fest';

export class CreateChatRoomDto {
  @ApiPropertyOptional({ example: 'Consultation Room' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'consultation', enum: ['direct', 'group', 'consultation', 'emergency', 'support', 'referral'] })
  @IsEnum(['direct', 'group', 'consultation', 'emergency', 'support', 'referral'])
  type: 'direct' | 'group' | 'consultation' | 'emergency' | 'support' | 'referral';

  @ApiPropertyOptional({ example: 'appointment-uuid' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'center-uuid' })
  @IsOptional()
  @IsUUID()
  centerId?: string;

  @ApiPropertyOptional({ example: 'referral-uuid' })
  @IsOptional()
  @IsUUID()
  referralId?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isEncrypted?: boolean;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @IsNumber()
  autoDeleteAfterDays?: number;

  @ApiProperty({
    description: 'Room settings and configuration',
    required: false,
    type: 'object'
  })
  @IsOptional()
  roomSettings?: JsonObject;

  @ApiProperty({ example: ['user-uuid-1', 'user-uuid-2'] })
  @IsUUID('4', { each: true })
  participantIds: string[];
}

import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsUUID, IsDateString, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVideoConferenceDto {
  @ApiProperty({ example: 'Patient Consultation' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Follow-up consultation for patient' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'consultation', enum: ['consultation', 'meeting', 'emergency', 'group_session', 'training'] })
  @IsOptional()
  @IsEnum(['consultation', 'meeting', 'emergency', 'group_session', 'training'])
  type?: 'consultation' | 'meeting' | 'emergency' | 'group_session' | 'training';

  @ApiPropertyOptional({ example: 'appointment-uuid' })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiPropertyOptional({ example: 'chat-room-uuid' })
  @IsOptional()
  @IsUUID()
  chatRoomId?: string;

  @ApiPropertyOptional({ example: 'center-uuid' })
  @IsOptional()
  @IsUUID()
  centerId?: string;

  @ApiPropertyOptional({ example: '2024-02-01T10:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledStartTime?: string;

  @ApiPropertyOptional({ example: '2024-02-01T11:00:00Z' })
  @IsOptional()
  @IsDateString()
  scheduledEndTime?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Max(10)
  maxParticipants?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isRecordingEnabled?: boolean;

  @ApiPropertyOptional({ example: 'password123' })
  @IsOptional()
  @IsString()
  meetingPassword?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  waitingRoomEnabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  autoAdmitParticipants?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  muteParticipantsOnEntry?: boolean;

  @ApiPropertyOptional({ example: 'webrtc', enum: ['internal', 'zoom', 'teams', 'webrtc'] })
  @IsOptional()
  @IsEnum(['internal', 'zoom', 'teams', 'webrtc'])
  provider?: 'internal' | 'zoom' | 'teams' | 'webrtc';

  @ApiPropertyOptional({ example: ['user-uuid-1', 'user-uuid-2'] })
  @IsOptional()
  @IsUUID('4', { each: true })
  participantIds?: string[];
}

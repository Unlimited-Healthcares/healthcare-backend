import { IsEmail, IsString, IsIn, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email address to send invitation to' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    description: 'Type of invitation',
    enum: ['staff_invitation', 'doctor_invitation', 'patient_invitation', 'collaboration_invitation']
  })
  @IsString()
  @IsIn(['staff_invitation', 'doctor_invitation', 'patient_invitation', 'collaboration_invitation'])
  invitationType: string;

  @ApiPropertyOptional({ description: 'Role for staff invitations' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Invitation message' })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({ description: 'Center ID for staff invitations' })
  @IsOptional()
  @IsString()
  centerId?: string;

  @ApiPropertyOptional({ description: 'Additional metadata for the invitation' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

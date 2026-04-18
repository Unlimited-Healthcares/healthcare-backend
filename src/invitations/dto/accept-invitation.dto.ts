import { IsString, IsNotEmpty, MinLength, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Password (minimum 8 characters)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Additional profile data' })
  @IsOptional()
  @IsObject()
  profileData?: Record<string, unknown>;
}


import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, IsArray, IsBoolean, IsDate } from 'class-validator';
import { UpdateProfileDto } from './update-profile.dto';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com', description: 'User email' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'User password' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: ['patient'], description: 'User roles' })
  @IsArray()
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({ description: 'User refresh token' })
  @IsString()
  @IsOptional()
  refreshToken?: string | null;

  @ApiPropertyOptional({ description: 'User profile information' })
  @IsOptional()
  profile?: UpdateProfileDto;

  // Email verification fields
  @ApiPropertyOptional({ description: 'Whether email is verified' })
  @IsBoolean()
  @IsOptional()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({ description: 'Email verification token' })
  @IsString()
  @IsOptional()
  emailVerificationToken?: string | null;

  @ApiPropertyOptional({ description: 'Email verification token expiry' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  emailVerificationTokenExpiry?: Date | null;

  // Password reset fields
  @ApiPropertyOptional({ description: 'Password reset token' })
  @IsString()
  @IsOptional()
  passwordResetToken?: string | null;

  @ApiPropertyOptional({ description: 'Password reset token expiry' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  passwordResetTokenExpiry?: Date | null;

  @IsDate()
  @IsOptional()
  lastVerificationSentAt?: Date;

  @IsDate()
  @IsOptional()
  lastPasswordResetSentAt?: Date;
}

import { IsEmail, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'Email address to resend verification to',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Channel to send verification code through',
    example: 'email',
    enum: ['email', 'sms', 'whatsapp'],
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['email', 'sms', 'whatsapp'])
  channel?: 'email' | 'sms' | 'whatsapp';
}

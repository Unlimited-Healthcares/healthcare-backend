import { IsString, IsEmail, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { SupportTicketPriority } from '../entities/support-ticket.entity';

export class CreateSupportTicketDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsEnum(SupportTicketPriority)
  priority?: SupportTicketPriority;

  @IsOptional()
  metadata?: Record<string, any>;
}

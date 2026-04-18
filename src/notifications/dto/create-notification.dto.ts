import { IsString, IsOptional, IsBoolean, IsDateString, IsIn } from 'class-validator';

export class CreateNotificationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  centerId?: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  @IsIn(['in_app', 'email', 'sms', 'push', 'both', 'all'])
  deliveryMethod?: string;

  @IsOptional()
  @IsString()
  relatedType?: string;

  @IsOptional()
  @IsString()
  relatedId?: string;

  @IsOptional()
  data?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

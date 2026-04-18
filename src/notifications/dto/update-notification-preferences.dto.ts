
import { IsOptional, IsString, IsBoolean, IsIn } from 'class-validator';

const deliveryOptions = ['none', 'email', 'push', 'both'];

export class UpdateNotificationPreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  phoneVerified?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  medicalRecordRequest?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  medicalRecordAccess?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  recordShareExpiring?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  appointment?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  message?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  system?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  referral?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  testResult?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  payment?: string;

  @IsOptional()
  @IsString()
  @IsIn(deliveryOptions)
  marketing?: string;

  @IsOptional()
  @IsString()
  quietHoursStart?: string;

  @IsOptional()
  @IsString()
  quietHoursEnd?: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

import { IsOptional, IsEnum, IsString, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountStatus } from '../entities/user-management.entity';

export class CreateUserManagementDto {
  @IsString()
  userId: string;

  @IsEnum(AccountStatus)
  @IsOptional()
  accountStatus?: AccountStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateUserManagementDto {
  @IsEnum(AccountStatus)
  @IsOptional()
  accountStatus?: AccountStatus;

  @IsDateString()
  @IsOptional()
  suspendedUntil?: string;

  @IsString()
  @IsOptional()
  suspensionReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UserManagementFiltersDto {
  @IsEnum(AccountStatus)
  @IsOptional()
  accountStatus?: AccountStatus;

  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  role?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

export class BulkUserActionDto {
  @IsString({ each: true })
  userIds: string[];

  @IsString()
  action: string; // suspend, activate, ban, etc.

  @IsString()
  @IsOptional()
  reason?: string;

  @IsDateString()
  @IsOptional()
  suspendedUntil?: string;
}

import { IsOptional, IsEnum, IsString, IsBoolean, IsNotEmpty } from 'class-validator';
import { ConfigType } from '../entities/system-configuration.entity';
import { JsonValue } from '../../types/common';

export class CreateSystemConfigurationDto {
  @IsString()
  configKey: string;

  @IsNotEmpty()
  configValue: JsonValue;

  @IsEnum(ConfigType)
  configType: ConfigType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateSystemConfigurationDto {
  @IsOptional()
  configValue?: JsonValue;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SystemConfigurationFiltersDto {
  @IsEnum(ConfigType)
  @IsOptional()
  configType?: ConfigType;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  search?: string;
}

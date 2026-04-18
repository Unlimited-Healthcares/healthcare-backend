
import { IsString, IsOptional, IsInt, IsBoolean, IsHexColor } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAppointmentTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Type(() => Number)
  durationMinutes: number;

  @IsOptional()
  @IsHexColor()
  colorCode?: string;

  @IsOptional()
  @IsBoolean()
  requiresPreparation?: boolean;

  @IsOptional()
  @IsString()
  preparationInstructions?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

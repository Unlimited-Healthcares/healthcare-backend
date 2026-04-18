import { IsString, IsOptional, IsEnum, IsArray, IsUUID } from 'class-validator';

export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export class StartSessionDto {
  @IsOptional()
  @IsString()
  initialSymptoms?: string;

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsEnum(Sex)
  sex?: Sex;

  @IsOptional()
  @IsArray()
  existingConditions?: string[];

  @IsOptional()
  @IsArray()
  currentMedications?: string[];
}

export class ContinueSessionDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  message: string;
}

export class GetTriageResultDto {
  @IsUUID()
  sessionId: string;
}

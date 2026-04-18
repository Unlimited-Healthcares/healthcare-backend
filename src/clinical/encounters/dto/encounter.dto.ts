import { IsString, IsOptional, IsUUID, IsEnum, IsObject, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export enum EncounterType {
    CONSULTATION = 'consultation',
    EMERGENCY = 'emergency',
    FOLLOW_UP = 'follow-up',
    HOME_VISIT = 'home-visit',
}

export class CreateEncounterDto {
    @IsUUID()
    patientId: string;

    @IsOptional()
    @IsUUID()
    centerId?: string;

    @IsOptional()
    @IsUUID()
    appointmentId?: string;

    @IsEnum(EncounterType)
    type: EncounterType;

    @IsOptional()
    @IsString()
    chiefComplaint?: string;

    @IsOptional()
    @IsObject()
    vitals?: Record<string, unknown>;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}

export class UpdateEncounterDto extends PartialType(CreateEncounterDto) {
    @IsOptional()
    @IsEnum(['in-progress', 'completed', 'cancelled'])
    status?: string;

    @IsOptional()
    @IsString()
    clinicalNotes?: string;

    @IsOptional()
    @IsString()
    diagnosis?: string;

    @IsOptional()
    @IsString()
    treatmentPlan?: string;

    @IsOptional()
    @IsDateString()
    endTime?: string;
}

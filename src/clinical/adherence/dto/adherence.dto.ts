import { IsString, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateAdherenceDto {
    @IsUUID()
    patientId: string;

    @IsUUID()
    prescriptionId: string;

    @IsString()
    medicationName: string;

    @IsDateString()
    scheduledTime: string;
}

export class UpdateAdherenceDto extends PartialType(CreateAdherenceDto) {
    @IsOptional()
    @IsEnum(['pending', 'taken', 'missed', 'skipped'])
    status?: string;

    @IsOptional()
    @IsDateString()
    takenAt?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}

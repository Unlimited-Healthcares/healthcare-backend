import { IsString, IsOptional, IsUUID, IsEnum, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/swagger';

class MedicationDto {
    @IsString()
    name: string;

    @IsString()
    dosage: string;

    @IsString()
    frequency: string;

    @IsString()
    duration: string;

    @IsOptional()
    @IsString()
    instructions?: string;
}

export class CreatePrescriptionDto {
    @IsUUID()
    patientId: string;

    @IsOptional()
    @IsUUID()
    encounterId?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MedicationDto)
    medications: MedicationDto[];

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsDateString()
    expiresAt?: string;
}

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {
    @IsOptional()
    @IsEnum(['active', 'completed', 'cancelled', 'expired'])
    status?: string;
}

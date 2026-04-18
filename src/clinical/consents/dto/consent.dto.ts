import { IsString, IsOptional, IsUUID, IsEnum, IsObject } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

export class CreateConsentDto {
    @IsUUID()
    patientId: string;

    @IsString()
    title: string;

    @IsString()
    content: string;

    @IsString()
    version: string;

    @IsOptional()
    @IsString()
    ipAddress?: string;

    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown>;
}

export class UpdateConsentDto extends PartialType(CreateConsentDto) {
    @IsOptional()
    @IsEnum(['pending', 'signed', 'withdrawn'])
    status?: string;
}

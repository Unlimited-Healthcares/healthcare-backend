import { IsString, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { MortuaryStatus } from '../entities/mortuary-record.entity';

export class CreateMortuaryRecordDto {
    @IsString()
    deceasedName: string;

    @IsDateString()
    intakeDate: string;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsEnum(MortuaryStatus)
    @IsOptional()
    status?: MortuaryStatus;

    @IsString()
    @IsOptional()
    representativeName?: string;

    @IsString()
    @IsOptional()
    representativePhone?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    signedManifestUrl?: string;

    @IsUUID()
    centerId: string;
}

export class UpdateMortuaryRecordDto {
    @IsEnum(MortuaryStatus)
    @IsOptional()
    status?: MortuaryStatus;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsString()
    @IsOptional()
    notes?: string;

    @IsString()
    @IsOptional()
    signedManifestUrl?: string;
}

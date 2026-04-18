
import { IsString, IsEnum, IsOptional, IsNumber, IsUUID, IsBoolean } from 'class-validator';

export class CreateFacilityAssetDto {
    @IsUUID()
    @IsOptional()
    centerId?: string;

    @IsUUID()
    @IsOptional()
    userId?: string;

    @IsEnum(['service', 'equipment'])
    assetType: 'service' | 'equipment';

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    uses?: string;

    @IsNumber()
    @IsOptional()
    basePrice?: number;

    @IsNumber()
    @IsOptional()
    durationMinutes?: number;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}

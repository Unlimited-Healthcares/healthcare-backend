import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class SubmitKycDto {
    @ApiProperty({ description: 'Full legal name' })
    @IsString()
    fullName: string;

    @ApiProperty({ description: 'ID document type', enum: ['national_id', 'passport', 'drivers_license', 'voters_card'] })
    @IsEnum(['national_id', 'passport', 'drivers_license', 'voters_card'])
    idDocType: string;

    @ApiProperty({ description: 'ID document number' })
    @IsString()
    idDocNumber: string;

    @ApiProperty({ description: 'Street address' })
    @IsString()
    address: string;

    @ApiProperty({ description: 'City' })
    @IsString()
    city: string;

    @ApiProperty({ description: 'State / Region' })
    @IsString()
    state: string;

    @ApiProperty({ description: 'Zip / Postal code', required: false })
    @IsOptional()
    @IsString()
    zipCode?: string;

    @ApiProperty({ description: 'Already uploaded ID document URL', required: false })
    @IsOptional()
    @IsString()
    idDocumentUrl?: string;

    @ApiProperty({ description: 'Already uploaded selfie URL', required: false })
    @IsOptional()
    @IsString()
    selfieUrl?: string;
}

export class ReviewKycDto {
    @ApiProperty({ description: 'Review action', enum: ['APPROVED', 'REJECTED'] })
    @IsEnum(['APPROVED', 'REJECTED'])
    action: 'APPROVED' | 'REJECTED';

    @ApiProperty({ description: 'Review notes', required: false })
    @IsOptional()
    @IsString()
    notes?: string;
}

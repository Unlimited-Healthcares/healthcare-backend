import { IsString, IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../entities/referral-document.entity';

export class CreateReferralDocumentDto {
  @ApiProperty({ description: 'Referral ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  referralId: string;

  @ApiProperty({ description: 'Document name', example: 'Lab Results Report' })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Type of document', 
    enum: DocumentType,
    example: DocumentType.LAB_RESULT
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ 
    description: 'Description of the document',
    example: 'Complete blood count and metabolic panel results',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
} 
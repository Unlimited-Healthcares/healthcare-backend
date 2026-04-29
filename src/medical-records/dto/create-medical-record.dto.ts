import { IsString, IsOptional, IsArray, IsBoolean, IsUUID, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMedicalRecordDto {
  @IsUUID()
  patientId: string;

  @IsOptional()
  @IsUUID()
  centerId?: string;

  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @IsOptional()
  @IsUUID()
  workspaceId?: string;

  @IsString()
  recordType: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'Patient vital signs',
    required: false,
    example: { bp: '120/80', temp: 36.5, heartRate: 72 }
  })
  vitals?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'Structured medical data',
    required: false,
    example: {
      vitals: { bloodPressure: '120/80', heartRate: 72 },
      symptoms: ['headache', 'fatigue']
    }
  })
  recordData?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  treatment?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  followUp?: string;

  @IsOptional()
  @ApiProperty({ 
    description: 'Medications prescribed or taken',
    required: false,
    example: [
      { name: 'Aspirin', dosage: '100mg', frequency: 'daily' }
    ]
  })
  medications?: Record<string, unknown> | unknown[];

  @IsOptional()
  @IsBoolean()
  isSensitive?: boolean;

  @IsOptional()
  @IsBoolean()
  isShareable?: boolean;

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'Sharing restrictions for this record',
    required: false,
    example: {
      allowedRoles: ['doctor', 'nurse'],
      restrictedFields: ['personalNotes']
    }
  })
  sharingRestrictions?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fileAttachments?: string[];
}

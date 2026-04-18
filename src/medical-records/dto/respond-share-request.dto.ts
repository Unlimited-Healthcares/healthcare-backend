import { IsString, IsOptional, IsIn, IsObject, IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RespondShareRequestDto {
  @IsIn(['approved', 'denied'])
  requestStatus: string;

  @IsOptional()
  @IsString()
  responseNotes?: string;

  @IsOptional()
  @IsIn(['view', 'download', 'edit'])
  accessLevel?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'Scope of data to be shared',
    required: false 
  })
  sharedDataScope?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'Data scope for sharing',
    required: false 
  })
  dataScope?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @ApiProperty({ 
    description: 'Additional restrictions',
    required: false 
  })
  additionalRestrictions?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsISO8601()
  responseTime?: string;
}

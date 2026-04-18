import { PartialType } from '@nestjs/swagger';
import { CreateReferralDto } from './create-referral.dto';
import { IsEnum, IsString, IsOptional, IsUUID, IsDate } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReferralStatus } from '../entities/referral.entity';
import { Type } from 'class-transformer';

export class UpdateReferralDto extends PartialType(CreateReferralDto) {
  @ApiProperty({ 
    description: 'Current status of the referral', 
    enum: ReferralStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(ReferralStatus)
  status?: ReferralStatus;
  
  @ApiProperty({ 
    description: 'Response notes from the receiving provider',
    example: 'Patient requires specialist care. Recommend starting on insulin therapy.',
    required: false
  })
  @IsOptional()
  @IsString()
  responseNotes?: string;

  @ApiProperty({
    description: 'ID of the user who responded to the referral',
    required: false
  })
  @IsOptional()
  @IsUUID()
  respondedById?: string;

  @ApiProperty({
    description: 'Date when the referral was responded to',
    required: false
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  respondedDate?: Date;
} 
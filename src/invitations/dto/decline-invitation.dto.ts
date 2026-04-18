import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DeclineInvitationDto {
  @ApiPropertyOptional({ description: 'Reason for declining the invitation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

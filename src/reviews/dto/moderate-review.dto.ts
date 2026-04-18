
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReviewModerationAction {
  APPROVE = 'approve',
  REJECT = 'reject',
  FLAG = 'flag',
  UNFLAG = 'unflag'
}

export class ModerateReviewDto {
  @ApiProperty({
    description: 'Moderation action to take',
    enum: ReviewModerationAction,
    example: ReviewModerationAction.APPROVE
  })
  @IsEnum(ReviewModerationAction)
  action: ReviewModerationAction;

  @ApiPropertyOptional({
    description: 'Moderation notes',
    example: 'Review approved after verification'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

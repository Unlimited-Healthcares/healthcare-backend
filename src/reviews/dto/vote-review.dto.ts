
import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoteReviewDto {
  @ApiProperty({
    description: 'Whether the vote is helpful (true) or not helpful (false)',
    example: true
  })
  @IsBoolean()
  isHelpful: boolean;
}

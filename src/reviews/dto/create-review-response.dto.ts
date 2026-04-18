
import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewResponseDto {
  @ApiProperty({
    description: 'Response content from healthcare center',
    example: 'Thank you for your feedback. We appreciate your visit and are glad you had a positive experience.',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @Length(10, 1000)
  content: string;
}

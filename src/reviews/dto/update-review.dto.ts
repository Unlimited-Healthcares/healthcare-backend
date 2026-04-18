
import { IsString, IsNumber, IsOptional, IsArray, Min, Max, Length } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto {
  @ApiPropertyOptional({
    description: 'Overall rating (1-5 stars)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @ApiPropertyOptional({
    description: 'Staff friendliness rating (1-5)',
    example: 4.0,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  staffRating?: number;

  @ApiPropertyOptional({
    description: 'Facility cleanliness rating (1-5)',
    example: 5.0,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  cleanlinessRating?: number;

  @ApiPropertyOptional({
    description: 'Wait time satisfaction rating (1-5)',
    example: 3.0,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  waitTimeRating?: number;

  @ApiPropertyOptional({
    description: 'Treatment quality rating (1-5)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  treatmentRating?: number;

  @ApiPropertyOptional({
    description: 'Review title',
    example: 'Updated: Great experience at the clinic',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Review text content',
    example: 'Updated review: The staff was very friendly and professional.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Photo URLs attached to the review',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

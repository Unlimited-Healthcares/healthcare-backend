
import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, IsUUID, Min, Max, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiPropertyOptional({
    description: 'Healthcare center ID being reviewed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  centerId?: string;

  @ApiPropertyOptional({
    description: 'User ID being reviewed (e.g. Doctor, biotech Engineer)',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  revieweeUserId?: string;

  @ApiPropertyOptional({
    description: 'User ID who wrote the review',
    example: '123e4567-e89b-12d3-a456-426614174003',
  })
  @IsOptional()
  @IsUUID()
  reviewerUserId?: string;

  @ApiPropertyOptional({
    description: 'Center ID who wrote the review',
    example: '123e4567-e89b-12d3-a456-426614174004',
  })
  @IsOptional()
  @IsUUID()
  reviewerCenterId?: string;

  @ApiPropertyOptional({
    description: 'Request ID if review is based on a specific service request',
    example: '123e4567-e89b-12d3-a456-426614174005',
  })
  @IsOptional()
  @IsUUID()
  requestId?: string;

  @ApiPropertyOptional({
    description: 'Appointment ID if review is appointment-based',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  appointmentId?: string;

  @ApiProperty({
    description: 'Overall rating (1-5 stars)',
    example: 4.5,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  overallRating: number;

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
    example: 'Great experience at the clinic',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({
    description: 'Review text content',
    example: 'The staff was very friendly and professional. The facility was clean and well-maintained.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @Length(1, 2000)
  content?: string;

  @ApiPropertyOptional({
    description: 'Whether the review should be anonymous',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;

  @ApiPropertyOptional({
    description: 'Photo URLs attached to the review',
    example: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];
}

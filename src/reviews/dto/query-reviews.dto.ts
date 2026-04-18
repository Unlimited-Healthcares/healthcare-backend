
import { IsOptional, IsString, IsNumber, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ReviewSortBy {
  CREATED_AT = 'createdAt',
  RATING = 'overallRating',
  HELPFUL_VOTES = 'helpfulVotes',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryReviewsDto {
  @ApiPropertyOptional({
    description: 'Healthcare center ID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  centerId?: string;

  @ApiPropertyOptional({
    description: 'Patient ID to filter by',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({ description: 'Link to the service request or appointment' })
  @IsOptional()
  @IsString()
  requestId?: string;

  @ApiPropertyOptional({ description: 'Appointment ID if review is appointment-based' })
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @ApiPropertyOptional({ description: 'Reviewee user ID to filter by' })
  @IsOptional()
  @IsString()
  revieweeUserId?: string;

  @ApiPropertyOptional({ description: 'Reviewer user ID to filter by' })
  @IsOptional()
  @IsString()
  reviewerUserId?: string;

  @ApiPropertyOptional({
    description: 'Minimum rating to filter by',
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Maximum rating to filter by',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({
    description: 'Filter by verified reviews only',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by reviews with responses',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasResponse?: boolean;

  @ApiPropertyOptional({
    description: 'Search in review content',
    example: 'friendly staff',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort reviews by',
    enum: ReviewSortBy,
    example: ReviewSortBy.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(ReviewSortBy)
  sortBy?: ReviewSortBy;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  ParseUUIDPipe,
  UseInterceptors
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ReviewsService } from './services/reviews.service';
import { ReviewAnalyticsService } from './services/review-analytics.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { CreateReviewResponseDto } from './dto/create-review-response.dto';
import { ModerateReviewDto } from './dto/moderate-review.dto';
import { VoteReviewDto } from './dto/vote-review.dto';
import { UploadReviewPhotosDto } from './dto/upload-review-photos.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { Review } from './entities/review.entity';
import { ReviewResponse } from './entities/review-response.entity';
import { ReviewPhoto } from './entities/review-photo.entity';
import { ReviewAnalytics } from './entities/review-analytics.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { UserRole } from '../users/constants/roles.constants';
import { 
  CenterReviewSummary, 
  TrendsAnalysis, 
  AdvancedAnalytics 
} from './types/analytics.types';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly analyticsService: ReviewAnalyticsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully', type: Review })
  @ApiResponse({ status: 400, description: 'Bad request - validation errors or duplicate review' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only patients can create reviews' })
  async createReview(
    @Body() createReviewDto: CreateReviewDto,
    @GetCurrentUserId() userId: string,
  ): Promise<Review> {
    return this.reviewsService.createReview(createReviewDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async getReviews(@Query() queryDto: QueryReviewsDto) {
    return this.reviewsService.getReviews(queryDto);
  }

  @Get('appointments/:appointmentId')
  @ApiOperation({ summary: 'Get reviews for a specific appointment' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully', type: [Review] })
  async getReviewsByAppointment(@Param('appointmentId', ParseUUIDPipe) appointmentId: string): Promise<Review[]> {
    return this.reviewsService.getReviewsByAppointment(appointmentId);
  }

  @Get('centers/:centerId/summary')
  @ApiOperation({ summary: 'Get review summary for a healthcare center' })
  @ApiResponse({ status: 200, description: 'Review summary retrieved successfully' })
  async getCenterReviewSummary(@Param('centerId', ParseUUIDPipe) centerId: string): Promise<CenterReviewSummary> {
    return this.reviewsService.getCenterReviewSummary(centerId);
  }

  @Get('centers/:centerId/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HEALTHCARE_PROVIDER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get review analytics for a healthcare center' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getCenterAnalytics(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Query('months') months?: number,
  ): Promise<ReviewAnalytics[]> {
    return this.analyticsService.getAnalytics(centerId, months);
  }

  @Get('centers/:centerId/trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HEALTHCARE_PROVIDER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get review trends for a healthcare center' })
  @ApiResponse({ status: 200, description: 'Trends retrieved successfully' })
  async getCenterTrends(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Query('months') months?: number,
  ): Promise<TrendsAnalysis> {
    return this.analyticsService.getTrends(centerId, months);
  }

  @Get('centers/:centerId/advanced-analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HEALTHCARE_PROVIDER, UserRole.STAFF, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get advanced analytics for a healthcare center' })
  @ApiResponse({ status: 200, description: 'Advanced analytics retrieved successfully' })
  async getAdvancedAnalytics(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('includePhotos') includePhotos?: boolean,
    @Query('includeResponses') includeResponses?: boolean,
  ): Promise<AdvancedAnalytics> {
    const options = {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      includePhotos: includePhotos === true,
      includeResponses: includeResponses === true,
    };
    return this.reviewsService.getAdvancedAnalytics(centerId, options);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific review by ID' })
  @ApiResponse({ status: 200, description: 'Review found', type: Review })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReview(@Param('id', ParseUUIDPipe) id: string): Promise<Review> {
    return this.reviewsService.getReviewById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully', type: Review })
  @ApiResponse({ status: 403, description: 'Forbidden - can only update own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetCurrentUserId() userId: string,
  ): Promise<Review> {
    return this.reviewsService.updateReview(id, updateReviewDto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - can only delete own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async deleteReview(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUserId() userId: string,
  ): Promise<void> {
    return this.reviewsService.deleteReview(id, userId);
  }

  @Post(':id/response')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.HEALTHCARE_PROVIDER, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a response to a review' })
  @ApiResponse({ status: 201, description: 'Response created successfully', type: ReviewResponse })
  @ApiResponse({ status: 400, description: 'Bad request - review already has response' })
  @ApiResponse({ status: 403, description: 'Forbidden - only healthcare providers can respond' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async createResponse(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() createResponseDto: CreateReviewResponseDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ReviewResponse> {
    return this.reviewsService.createResponse(reviewId, createResponseDto, userId);
  }

  @Put(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Moderate a review (admin/staff only)' })
  @ApiResponse({ status: 200, description: 'Review moderated successfully', type: Review })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async moderateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moderateDto: ModerateReviewDto,
    @GetCurrentUserId() userId: string,
  ): Promise<Review> {
    return this.reviewsService.moderateReview(id, moderateDto, userId);
  }

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on review helpfulness' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async voteOnReview(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() voteDto: VoteReviewDto,
    @GetCurrentUserId() userId: string,
  ): Promise<void> {
    return this.reviewsService.voteOnReview(reviewId, voteDto, userId);
  }

  @Post(':id/photos')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload photos for a review' })
  @ApiResponse({ status: 201, description: 'Photos uploaded successfully', type: [ReviewPhoto] })
  @ApiResponse({ status: 403, description: 'Forbidden - can only upload to own reviews' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @UseInterceptors(FilesInterceptor('photos'))
  async uploadReviewPhotos(
    @Param('id', ParseUUIDPipe) reviewId: string,
    @Body() uploadDto: UploadReviewPhotosDto,
    @GetCurrentUserId() userId: string,
  ): Promise<ReviewPhoto[]> {
    return this.reviewsService.uploadReviewPhotos(reviewId, uploadDto, userId);
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'Get photos for a review' })
  @ApiResponse({ status: 200, description: 'Photos retrieved successfully', type: [ReviewPhoto] })
  @ApiResponse({ status: 404, description: 'Review not found' })
  async getReviewPhotos(@Param('id', ParseUUIDPipe) reviewId: string): Promise<ReviewPhoto[]> {
    return this.reviewsService.getReviewPhotos(reviewId);
  }
}

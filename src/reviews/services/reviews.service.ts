import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Review } from '../entities/review.entity';
import { ReviewResponse } from '../entities/review-response.entity';
import { ReviewVote } from '../entities/review-vote.entity';
import { ReviewPhoto } from '../entities/review-photo.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { CreateReviewResponseDto } from '../dto/create-review-response.dto';
import { ModerateReviewDto, ReviewModerationAction } from '../dto/moderate-review.dto';
import { VoteReviewDto } from '../dto/vote-review.dto';
import { UploadReviewPhotosDto } from '../dto/upload-review-photos.dto';
import { QueryReviewsDto, ReviewSortBy, SortOrder } from '../dto/query-reviews.dto';
import { AuditLogService } from '../../audit/audit-log.service';
import { PatientsService } from '../../patients/patients.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import {
  SentimentAnalysis,
  ResponseMetrics,
  TimeTrends,
  PhotoMetrics,
  ReviewWithVotes,
  AdvancedAnalytics,
  CenterReviewSummary
} from '../types/analytics.types';

interface ResponseTimeData {
  responseTime: number;
  createdAt: Date;
  respondedAt?: Date;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(ReviewResponse)
    private reviewResponseRepository: Repository<ReviewResponse>,
    @InjectRepository(ReviewVote)
    private reviewVoteRepository: Repository<ReviewVote>,
    @InjectRepository(ReviewPhoto)
    private reviewPhotoRepository: Repository<ReviewPhoto>,
    private auditLogService: AuditLogService,
    private patientsService: PatientsService,
    private notificationsService: NotificationsService,
  ) { }

  async createReview(createReviewDto: CreateReviewDto, userId: string): Promise<Review> {
    // Check if reviewer already reviewed this target for this request/appointment
    if (createReviewDto.requestId || createReviewDto.appointmentId) {
      const query = this.reviewRepository.createQueryBuilder('review')
        .where('review.reviewerUserId = :userId', { userId });

      if (createReviewDto.requestId) {
        query.andWhere('review.requestId = :requestId', { requestId: createReviewDto.requestId });
      } else if (createReviewDto.appointmentId) {
        query.andWhere('review.appointmentId = :appointmentId', { appointmentId: createReviewDto.appointmentId });
      }

      const existingCount = await query.getCount();

      if (existingCount > 0) {
        throw new BadRequestException('You have already reviewed this service interaction');
      }
    }

    const review = this.reviewRepository.create({
      ...createReviewDto,
      reviewerUserId: userId,
      isVerified: !!(createReviewDto.appointmentId || createReviewDto.requestId),
      status: 'pending',
    });

    const savedReview = await this.reviewRepository.save(review);

    await this.auditLogService.log({
      action: 'CREATE_REVIEW',
      entityType: 'Review',
      entityId: savedReview.id,
      userId,
      details: {
        centerId: createReviewDto.centerId,
        rating: createReviewDto.overallRating,
      },
    });

    // Notify the target center/provider about a new review
    if (createReviewDto.centerId) {
      if (createReviewDto.revieweeUserId) {
        await this.notificationsService.createNotification({
          userId: createReviewDto.revieweeUserId,
          title: 'New Patient Review',
          message: `You have received a new ${createReviewDto.overallRating}-star review.`,
          type: 'review_received',
          data: { reviewId: savedReview.id, rating: createReviewDto.overallRating }
        });
      }
    }

    return savedReview;
  }

  async getReviews(queryDto: QueryReviewsDto): Promise<{ reviews: Review[]; total: number; page: number; limit: number }> {
    const {
      centerId,
      patientId,
      minRating,
      maxRating,
      verifiedOnly,
      hasResponse,
      search,
      sortBy = ReviewSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 10,
    } = queryDto;

    const queryBuilder = this.createReviewQueryBuilder();

    // Apply filters
    if (centerId) {
      queryBuilder.andWhere('review.centerId = :centerId', { centerId });
    }

    if (patientId) {
      queryBuilder.andWhere('review.patientId = :patientId', { patientId });
    }

    if (queryDto.revieweeUserId) {
      queryBuilder.andWhere('review.revieweeUserId = :revieweeUserId', { revieweeUserId: queryDto.revieweeUserId });
    }

    if (queryDto.reviewerUserId) {
      queryBuilder.andWhere('review.reviewerUserId = :reviewerUserId', { reviewerUserId: queryDto.reviewerUserId });
    }

    if (minRating) {
      queryBuilder.andWhere('review.overallRating >= :minRating', { minRating });
    }

    if (maxRating) {
      queryBuilder.andWhere('review.overallRating <= :maxRating', { maxRating });
    }

    if (verifiedOnly) {
      queryBuilder.andWhere('review.isVerified = :verifiedOnly', { verifiedOnly });
    }

    if (hasResponse !== undefined) {
      if (hasResponse) {
        queryBuilder.andWhere('response.id IS NOT NULL');
      } else {
        queryBuilder.andWhere('response.id IS NULL');
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(review.title ILIKE :search OR review.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Only show approved reviews for public queries
    queryBuilder.andWhere('review.status = :status', { status: 'approved' });

    // Apply sorting
    queryBuilder.orderBy(`review.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [reviews, total] = await queryBuilder.getManyAndCount();

    return {
      reviews,
      total,
      page,
      limit,
    };
  }

  async getReviewById(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['center', 'patient', 'response', 'response.responder', 'revieweeUser', 'reviewerUser', 'reviewerCenter'],
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return review;
  }

  async updateReview(id: string, updateReviewDto: UpdateReviewDto, userId: string): Promise<Review> {
    const review = await this.getReviewById(id);

    // Check if user owns this review
    if (review.patient.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Update review
    Object.assign(review, updateReviewDto);
    review.isEdited = true;
    review.editedAt = new Date();
    review.status = 'pending'; // Re-review after edit

    const updatedReview = await this.reviewRepository.save(review);

    await this.auditLogService.log({
      action: 'UPDATE_REVIEW',
      entityType: 'Review',
      entityId: id,
      userId,
      details: updateReviewDto as Record<string, unknown>,
    });

    return updatedReview;
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const review = await this.getReviewById(id);

    // Check if user owns this review
    if (review.patient.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);

    await this.auditLogService.log({
      action: 'DELETE_REVIEW',
      entityType: 'Review',
      entityId: id,
      userId,
    });
  }

  async createResponse(reviewId: string, createResponseDto: CreateReviewResponseDto, userId: string): Promise<ReviewResponse> {
    const review = await this.getReviewById(reviewId);

    // Check if response already exists
    if (review.response) {
      throw new BadRequestException('Review already has a response');
    }

    const response = this.reviewResponseRepository.create({
      reviewId,
      content: createResponseDto.content,
      respondedBy: userId,
    });

    const savedResponse = await this.reviewResponseRepository.save(response);

    await this.auditLogService.log({
      action: 'CREATE_REVIEW_RESPONSE',
      entityType: 'ReviewResponse',
      entityId: savedResponse.id,
      userId,
      details: { reviewId },
    });

    // Notify the reviewer about the response
    const reviewerUserId = review.reviewerUserId || review.patient?.userId;
    if (reviewerUserId) {
      await this.notificationsService.createNotification({
        userId: reviewerUserId,
        title: 'Response to Your Review',
        message: 'A healthcare provider has responded to your review.',
        type: 'review_response_received',
        data: { reviewId }
      });
    }

    return savedResponse;
  }

  async moderateReview(id: string, moderateDto: ModerateReviewDto, userId: string): Promise<Review> {
    const review = await this.getReviewById(id);

    let newStatus: string;
    switch (moderateDto.action) {
      case ReviewModerationAction.APPROVE:
        newStatus = 'approved';
        break;
      case ReviewModerationAction.REJECT:
        newStatus = 'rejected';
        break;
      case ReviewModerationAction.FLAG:
        newStatus = 'flagged';
        break;
      case ReviewModerationAction.UNFLAG:
        newStatus = 'pending';
        break;
      default:
        throw new BadRequestException('Invalid moderation action');
    }

    review.status = newStatus as 'pending' | 'approved' | 'rejected' | 'flagged';
    review.moderatedBy = userId;
    review.moderationNotes = moderateDto.notes;

    const updatedReview = await this.reviewRepository.save(review);

    await this.auditLogService.log({
      action: 'MODERATE_REVIEW',
      entityType: 'Review',
      entityId: id,
      userId,
      details: {
        action: moderateDto.action,
        previousStatus: review.status,
        newStatus,
        notes: moderateDto.notes,
      },
    });

    // Notify reviewer about moderation status
    const reviewerUserId = review.reviewerUserId || review.patient?.userId;
    if (reviewerUserId && (newStatus === 'approved' || newStatus === 'rejected')) {
      await this.notificationsService.createNotification({
        userId: reviewerUserId,
        title: `Review ${newStatus === 'approved' ? 'Approved' : 'Updated'}`,
        message: newStatus === 'approved' ? 'Your review has been approved and is now public.' : 'Your review status has been updated by our moderation team.',
        type: 'review_moderated',
        data: { reviewId: id, status: newStatus }
      });
    }

    return updatedReview;
  }

  async voteOnReview(reviewId: string, voteDto: VoteReviewDto, userId: string): Promise<void> {
    // Verify review exists
    await this.getReviewById(reviewId);

    // Check if user already voted
    const existingVote = await this.reviewVoteRepository.findOne({
      where: { reviewId, userId },
    });

    if (existingVote) {
      // Update existing vote
      existingVote.isHelpful = voteDto.isHelpful;
      await this.reviewVoteRepository.save(existingVote);
    } else {
      // Create new vote
      const vote = this.reviewVoteRepository.create({
        reviewId,
        userId,
        isHelpful: voteDto.isHelpful,
      });
      await this.reviewVoteRepository.save(vote);
    }

    // Update vote counts on review
    await this.updateReviewVoteCounts(reviewId);

    await this.auditLogService.log({
      action: 'VOTE_REVIEW',
      entityType: 'Review',
      entityId: reviewId,
      userId,
      details: { isHelpful: voteDto.isHelpful },
    });
  }

  async uploadReviewPhotos(reviewId: string, uploadDto: UploadReviewPhotosDto, userId: string): Promise<ReviewPhoto[]> {
    const review = await this.getReviewById(reviewId);

    // Check if user owns this review
    if (review.patient.userId !== userId) {
      throw new ForbiddenException('You can only upload photos to your own reviews');
    }

    // Delete existing photos
    await this.reviewPhotoRepository.delete({ reviewId });

    // Create new photos
    const photos = uploadDto.photos.map((photoUrl, index) =>
      this.reviewPhotoRepository.create({
        reviewId,
        photoUrl,
        caption: uploadDto.captions?.[index],
        displayOrder: index,
      })
    );

    const savedPhotos = await this.reviewPhotoRepository.save(photos);

    // Update review photos array for backward compatibility
    review.photos = uploadDto.photos;
    await this.reviewRepository.save(review);

    await this.auditLogService.log({
      action: 'UPLOAD_REVIEW_PHOTOS',
      entityType: 'Review',
      entityId: reviewId,
      userId,
      details: { photoCount: uploadDto.photos.length },
    });

    return savedPhotos;
  }

  async getReviewPhotos(reviewId: string): Promise<ReviewPhoto[]> {
    // Check if review exists first
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId }
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    return this.reviewPhotoRepository.find({
      where: { reviewId },
      order: { displayOrder: 'ASC' },
    });
  }

  async getReviewsByAppointment(appointmentId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { appointmentId },
      relations: ['center', 'patient', 'response'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAdvancedAnalytics(centerId: string, options: {
    startDate?: Date;
    endDate?: Date;
    includePhotos?: boolean;
    includeResponses?: boolean;
  } = {}): Promise<AdvancedAnalytics> {
    const queryBuilder = this.reviewRepository.createQueryBuilder('review')
      .where('review.centerId = :centerId', { centerId })
      .andWhere('review.status = :status', { status: 'approved' });

    if (options.startDate) {
      queryBuilder.andWhere('review.createdAt >= :startDate', { startDate: options.startDate });
    }

    if (options.endDate) {
      queryBuilder.andWhere('review.createdAt <= :endDate', { endDate: options.endDate });
    }

    const [reviews, totalReviews] = await queryBuilder.getManyAndCount();

    // Calculate sentiment analysis
    const sentimentAnalysis = this.calculateSentimentAnalysis(reviews);

    // Calculate response metrics
    const responseMetrics = await this.calculateResponseMetrics(centerId, options);

    // Calculate photo metrics
    const photoMetrics = options.includePhotos ? await this.calculatePhotoMetrics(centerId) : null;

    // Calculate time-based trends
    const trends = await this.calculateTimeTrends(centerId, options);

    return {
      totalReviews,
      sentimentAnalysis,
      responseMetrics,
      photoMetrics,
      trends,
      reviewsWithVotes: await this.getReviewsWithVoteCounts(centerId),
    };
  }

  private async updateReviewVoteCounts(reviewId: string): Promise<void> {
    const voteCounts = await this.reviewVoteRepository
      .createQueryBuilder('vote')
      .select([
        'COUNT(*) as total_votes',
        'SUM(CASE WHEN vote.isHelpful = true THEN 1 ELSE 0 END) as helpful_votes',
      ])
      .where('vote.reviewId = :reviewId', { reviewId })
      .getRawOne();

    await this.reviewRepository.update(reviewId, {
      totalVotes: parseInt(voteCounts.total_votes),
      helpfulVotes: parseInt(voteCounts.helpful_votes),
    });
  }

  private calculateSentimentAnalysis(reviews: Review[]): SentimentAnalysis {
    if (reviews.length === 0) {
      return {
        positive: 0,
        negative: 0,
        neutral: 0,
        averageSentiment: 0,
        sentimentTrend: 'stable',
      };
    }

    let positive = 0;
    let negative = 0;
    let neutral = 0;
    let totalSentiment = 0;

    reviews.forEach(review => {
      const rating = review.overallRating;
      totalSentiment += rating;

      if (rating >= 4) positive++;
      else if (rating <= 2) negative++;
      else neutral++;
    });

    const averageSentiment = totalSentiment / reviews.length;

    return {
      positive: (positive / reviews.length) * 100,
      negative: (negative / reviews.length) * 100,
      neutral: (neutral / reviews.length) * 100,
      averageSentiment,
      sentimentTrend: averageSentiment >= 4 ? 'improving' : averageSentiment <= 2 ? 'declining' : 'stable',
    };
  }

  private async calculateResponseMetrics(centerId: string, options: { startDate?: Date; endDate?: Date }): Promise<ResponseMetrics> {
    // Implementation for calculating response metrics
    const responses = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoin('review.response', 'response')
      .where('review.centerId = :centerId', { centerId })
      .andWhere(options.startDate ? 'review.createdAt >= :startDate' : '1=1', { startDate: options.startDate })
      .andWhere(options.endDate ? 'review.createdAt <= :endDate' : '1=1', { endDate: options.endDate })
      .select(['review.id', 'review.createdAt', 'response.createdAt'])
      .getRawMany();

    const responseData: ResponseTimeData[] = responses.map(r => ({
      responseTime: r.response_createdAt ?
        new Date(r.response_createdAt).getTime() - new Date(r.review_createdAt).getTime() : 0,
      createdAt: new Date(r.review_createdAt),
      respondedAt: r.response_createdAt ? new Date(r.response_createdAt) : undefined,
    }));

    const averageResponseTime = this.calculateAverageResponseTime(responseData);
    const totalResponses = responseData.filter(r => r.respondedAt).length;
    const responseRate = responses.length > 0 ? (totalResponses / responses.length) * 100 : 0;
    const quickResponseCount = responseData.filter(r => r.responseTime < 24 * 60 * 60 * 1000).length; // < 24 hours
    const delayedResponseCount = responseData.filter(r => r.responseTime >= 24 * 60 * 60 * 1000).length; // >= 24 hours

    return {
      averageResponseTime,
      totalResponses,
      responseRate,
      quickResponseCount,
      delayedResponseCount,
    };
  }

  private async calculatePhotoMetrics(centerId: string): Promise<PhotoMetrics> {
    const reviews = await this.reviewRepository.find({
      where: { centerId },
      select: ['photos'],
    });

    let totalPhotos = 0;
    let reviewsWithPhotos = 0;

    reviews.forEach(review => {
      if (review.photos && review.photos.length > 0) {
        totalPhotos += review.photos.length;
        reviewsWithPhotos++;
      }
    });

    return {
      totalPhotos,
      reviewsWithPhotos,
      averagePhotosPerReview: reviewsWithPhotos > 0 ? totalPhotos / reviewsWithPhotos : 0,
    };
  }

  private async calculateTimeTrends(centerId: string, options: { startDate?: Date; endDate?: Date }): Promise<TimeTrends> {
    const reviews = await this.reviewRepository.find({
      where: {
        centerId,
        ...(options.startDate && { createdAt: MoreThanOrEqual(options.startDate) }),
        ...(options.endDate && { createdAt: LessThanOrEqual(options.endDate) }),
      },
      order: { createdAt: 'ASC' },
    });

    const daily: Record<string, number> = {};
    const weekly: Record<string, number> = {};
    const monthly: Record<string, number> = {};

    reviews.forEach(review => {
      const date = review.createdAt;
      const dayKey = date.toISOString().split('T')[0];
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      daily[dayKey] = (daily[dayKey] || 0) + 1;
      weekly[weekKey] = (weekly[weekKey] || 0) + 1;
      monthly[monthKey] = (monthly[monthKey] || 0) + 1;
    });

    // Calculate trend
    const monthlyValues = Object.values(monthly);
    const trend = monthlyValues.length >= 2 ?
      (monthlyValues[monthlyValues.length - 1] > monthlyValues[monthlyValues.length - 2] ? 'increasing' :
        monthlyValues[monthlyValues.length - 1] < monthlyValues[monthlyValues.length - 2] ? 'decreasing' : 'stable') : 'stable';

    return { daily, weekly, monthly, trend };
  }

  private calculateAverageResponseTime(responses: ResponseTimeData[]): number {
    const validResponses = responses.filter(r => r.responseTime > 0);
    if (validResponses.length === 0) return 0;

    const totalTime = validResponses.reduce((sum, r) => sum + r.responseTime, 0);
    return totalTime / validResponses.length;
  }

  private async getReviewsWithVoteCounts(centerId: string): Promise<ReviewWithVotes[]> {
    const reviews = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.votes', 'votes')
      .where('review.centerId = :centerId', { centerId })
      .orderBy('review.helpfulVotes', 'DESC')
      .take(10)
      .getMany();

    return reviews as ReviewWithVotes[];
  }

  async getCenterReviewSummary(centerId: string): Promise<CenterReviewSummary> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'COUNT(*) as total_reviews',
        'AVG(review.overallRating) as average_rating',
        'COUNT(CASE WHEN review.overallRating = 5 THEN 1 END) as five_stars',
        'COUNT(CASE WHEN review.overallRating = 4 THEN 1 END) as four_stars',
        'COUNT(CASE WHEN review.overallRating = 3 THEN 1 END) as three_stars',
        'COUNT(CASE WHEN review.overallRating = 2 THEN 1 END) as two_stars',
        'COUNT(CASE WHEN review.overallRating = 1 THEN 1 END) as one_stars',
        'COUNT(CASE WHEN review.isVerified = true THEN 1 END) as verified_reviews',
      ])
      .leftJoin('review.response', 'response')
      .addSelect('COUNT(response.id) as reviews_with_responses')
      .where('review.centerId = :centerId', { centerId })
      .andWhere('review.status = :status', { status: 'approved' })
      .getRawOne();

    const totalReviews = parseInt(result.total_reviews);
    const responseRate = totalReviews > 0
      ? (parseFloat(result.reviews_with_responses) / totalReviews) * 100
      : 0;

    // Get recent reviews
    const recentReviews = await this.reviewRepository.find({
      where: { centerId, status: 'approved' },
      relations: ['patient'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Calculate average response time (simplified)
    const averageResponseTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds (placeholder)

    return {
      totalReviews,
      averageRating: parseFloat(result.average_rating) || 0,
      ratingDistribution: {
        fiveStars: parseInt(result.five_stars),
        fourStars: parseInt(result.four_stars),
        threeStars: parseInt(result.three_stars),
        twoStars: parseInt(result.two_stars),
        oneStars: parseInt(result.one_stars),
      },
      verifiedReviewsCount: parseInt(result.verified_reviews),
      responseRate,
      averageResponseTime,
      recentReviews,
    };
  }

  private createReviewQueryBuilder(): SelectQueryBuilder<Review> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.center', 'center')
      .leftJoinAndSelect('review.patient', 'patient')
      .leftJoinAndSelect('review.revieweeUser', 'revieweeUser')
      .leftJoinAndSelect('review.reviewerUser', 'reviewerUser')
      .leftJoinAndSelect('review.reviewerCenter', 'reviewerCenter')
      .leftJoinAndSelect('review.response', 'response')
      .leftJoinAndSelect('response.responder', 'responder');
  }
}

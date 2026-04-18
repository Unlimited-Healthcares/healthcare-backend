import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewAnalytics } from '../entities/review-analytics.entity';
import { Review } from '../entities/review.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  TrendsAnalysis
} from '../types/analytics.types';

@Injectable()
export class ReviewAnalyticsService {
  constructor(
    @InjectRepository(ReviewAnalytics)
    private analyticsRepository: Repository<ReviewAnalytics>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async getAnalytics(centerId: string, months: number = 12): Promise<ReviewAnalytics[]> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.analyticsRepository.find({
      where: {
        centerId,
      },
      order: {
        period: 'DESC',
      },
      take: months,
    });
  }

  async getTrends(centerId: string, months: number = 6): Promise<TrendsAnalysis> {
    const analytics = await this.getAnalytics(centerId, months);
    
    return {
      ratingTrend: analytics.map(a => ({
        period: a.period,
        averageRating: a.averageOverallRating,
        totalReviews: a.totalReviews,
      })),
      categoryTrends: {
        staff: analytics.map(a => ({ period: a.period, rating: a.averageStaffRating })),
        cleanliness: analytics.map(a => ({ period: a.period, rating: a.averageCleanlinessRating })),
        waitTime: analytics.map(a => ({ period: a.period, rating: a.averageWaitTimeRating })),
        treatment: analytics.map(a => ({ period: a.period, rating: a.averageTreatmentRating })),
      },
      responseRateTrend: analytics.map(a => ({
        period: a.period,
        responseRate: a.responseRate,
      })),
    };
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async generateMonthlyAnalytics(): Promise<void> {
    console.log('Generating monthly review analytics...');

    // Get all unique center IDs
    const centers = await this.reviewRepository
      .createQueryBuilder('review')
      .select('DISTINCT review.centerId', 'centerId')
      .getRawMany();

    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    for (const center of centers) {
      await this.generateCenterAnalytics(center.centerId, firstDayOfMonth);
    }

    console.log('Monthly review analytics generation completed');
  }

  private async generateCenterAnalytics(centerId: string, period: Date): Promise<void> {
    // Check if analytics already exist for this period
    const existing = await this.analyticsRepository.findOne({
      where: { centerId, period },
    });

    if (existing) {
      console.log(`Analytics already exist for center ${centerId} for period ${period}`);
      return;
    }

    // Calculate analytics for the previous month
    const startDate = new Date(period);
    const endDate = new Date(period.getFullYear(), period.getMonth() + 1, 0);

    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select([
        'COUNT(*) as total_reviews',
        'AVG(review.overallRating) as average_overall_rating',
        'AVG(review.staffRating) as average_staff_rating',
        'AVG(review.cleanlinessRating) as average_cleanliness_rating',
        'AVG(review.waitTimeRating) as average_wait_time_rating',
        'AVG(review.treatmentRating) as average_treatment_rating',
        'COUNT(CASE WHEN review.overallRating = 5 THEN 1 END) as five_star_count',
        'COUNT(CASE WHEN review.overallRating = 4 THEN 1 END) as four_star_count',
        'COUNT(CASE WHEN review.overallRating = 3 THEN 1 END) as three_star_count',
        'COUNT(CASE WHEN review.overallRating = 2 THEN 1 END) as two_star_count',
        'COUNT(CASE WHEN review.overallRating = 1 THEN 1 END) as one_star_count',
      ])
      .leftJoin('review.response', 'response')
      .addSelect('COUNT(response.id) as reviews_with_responses')
      .where('review.centerId = :centerId', { centerId })
      .andWhere('review.status = :status', { status: 'approved' })
      .andWhere('review.createdAt >= :startDate', { startDate })
      .andWhere('review.createdAt <= :endDate', { endDate })
      .getRawOne();

    const totalReviews = parseInt(result.total_reviews);
    const responseRate = totalReviews > 0 
      ? (parseFloat(result.reviews_with_responses) / totalReviews) * 100 
      : 0;

    const analytics = this.analyticsRepository.create({
      centerId,
      period,
      totalReviews,
      averageOverallRating: parseFloat(result.average_overall_rating) || 0,
      averageStaffRating: parseFloat(result.average_staff_rating) || 0,
      averageCleanlinessRating: parseFloat(result.average_cleanliness_rating) || 0,
      averageWaitTimeRating: parseFloat(result.average_wait_time_rating) || 0,
      averageTreatmentRating: parseFloat(result.average_treatment_rating) || 0,
      fiveStarCount: parseInt(result.five_star_count),
      fourStarCount: parseInt(result.four_star_count),
      threeStarCount: parseInt(result.three_star_count),
      twoStarCount: parseInt(result.two_star_count),
      oneStarCount: parseInt(result.one_star_count),
      responseRate,
      reviewsWithResponses: parseInt(result.reviews_with_responses),
    });

    await this.analyticsRepository.save(analytics);
  }
}

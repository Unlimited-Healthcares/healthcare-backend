import { Review } from '../entities/review.entity';
import { ReviewVote } from '../entities/review-vote.entity';

export interface SentimentAnalysis {
  positive: number;
  negative: number;
  neutral: number;
  averageSentiment: number;
  sentimentTrend: 'improving' | 'declining' | 'stable';
}

export interface ResponseMetrics {
  averageResponseTime: number;
  totalResponses: number;
  responseRate: number;
  quickResponseCount: number;
  delayedResponseCount: number;
}

export interface TimeTrends {
  daily: Record<string, number>;
  weekly: Record<string, number>;
  monthly: Record<string, number>;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface PhotoMetrics {
  totalPhotos: number;
  reviewsWithPhotos: number;
  averagePhotosPerReview: number;
}

export interface ReviewWithVotes extends Review {
  votes: ReviewVote[];
}

export interface AdvancedAnalytics {
  totalReviews: number;
  sentimentAnalysis: SentimentAnalysis;
  responseMetrics: ResponseMetrics;
  photoMetrics: PhotoMetrics | null;
  trends: TimeTrends;
  reviewsWithVotes: ReviewWithVotes[];
}

export interface CenterReviewSummary {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    fiveStars: number;
    fourStars: number;
    threeStars: number;
    twoStars: number;
    oneStars: number;
  };
  verifiedReviewsCount: number;
  responseRate: number;
  averageResponseTime: number;
  recentReviews: Review[];
}

export interface RatingTrend {
  period: Date;
  averageRating: number;
  totalReviews: number;
}

export interface CategoryTrend {
  period: Date;
  rating: number;
}

export interface ResponseRateTrend {
  period: Date;
  responseRate: number;
}

export interface TrendsAnalysis {
  ratingTrend: RatingTrend[];
  categoryTrends: {
    staff: CategoryTrend[];
    cleanliness: CategoryTrend[];
    waitTime: CategoryTrend[];
    treatment: CategoryTrend[];
  };
  responseRateTrend: ResponseRateTrend[];
} 
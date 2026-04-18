import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './services/reviews.service';
import { ReviewAnalyticsService } from './services/review-analytics.service';
import { Review } from './entities/review.entity';
import { ReviewResponse } from './entities/review-response.entity';
import { ReviewAnalytics } from './entities/review-analytics.entity';
import { ReviewVote } from './entities/review-vote.entity';
import { ReviewPhoto } from './entities/review-photo.entity';
import { AuditModule } from '../audit/audit.module';
import { PatientsModule } from '../patients/patients.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Review,
      ReviewResponse,
      ReviewAnalytics,
      ReviewVote,
      ReviewPhoto,
    ]),
    AuditModule,
    PatientsModule,
    NotificationsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewAnalyticsService],
  exports: [ReviewsService, ReviewAnalyticsService],
})
export class ReviewsModule { }

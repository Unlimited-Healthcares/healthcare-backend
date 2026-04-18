
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { HealthcareCenter } from '../../centers/entities/center.entity';

@Entity('review_analytics')
@Index(['centerId'])
@Index(['period'])
export class ReviewAnalytics {
  @ApiProperty({ description: 'Unique identifier for the analytics record' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Healthcare center ID' })
  @Column()
  centerId: string;

  @ApiProperty({ description: 'Analytics period (month/year)' })
  @Column({ type: 'date' })
  period: Date;

  @ApiProperty({ description: 'Total number of reviews' })
  @Column({ default: 0 })
  totalReviews: number;

  @ApiProperty({ description: 'Average overall rating' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageOverallRating: number;

  @ApiProperty({ description: 'Average staff rating' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageStaffRating: number;

  @ApiProperty({ description: 'Average cleanliness rating' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageCleanlinessRating: number;

  @ApiProperty({ description: 'Average wait time rating' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageWaitTimeRating: number;

  @ApiProperty({ description: 'Average treatment rating' })
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  averageTreatmentRating: number;

  @ApiProperty({ description: 'Number of 5-star reviews' })
  @Column({ default: 0 })
  fiveStarCount: number;

  @ApiProperty({ description: 'Number of 4-star reviews' })
  @Column({ default: 0 })
  fourStarCount: number;

  @ApiProperty({ description: 'Number of 3-star reviews' })
  @Column({ default: 0 })
  threeStarCount: number;

  @ApiProperty({ description: 'Number of 2-star reviews' })
  @Column({ default: 0 })
  twoStarCount: number;

  @ApiProperty({ description: 'Number of 1-star reviews' })
  @Column({ default: 0 })
  oneStarCount: number;

  @ApiProperty({ description: 'Response rate percentage' })
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  responseRate: number;

  @ApiProperty({ description: 'Number of reviews with responses' })
  @Column({ default: 0 })
  reviewsWithResponses: number;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'centerId' })
  center: HealthcareCenter;
}

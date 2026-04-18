
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewResponse } from './review-response.entity';
import { ReviewVote } from './review-vote.entity';

@Entity('reviews')
@Index(['centerId'])
@Index(['patientId'])
@Index(['revieweeUserId'])
@Index(['reviewerUserId'])
@Index(['requestId'])
@Index(['createdAt'])
@Index(['overallRating'])
@Index(['isVerified'])
export class Review {
  @ApiProperty({ description: 'Unique identifier for the review' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Healthcare center being reviewed', required: false })
  @Column({ nullable: true })
  centerId?: string;

  @ApiProperty({ description: 'Patient who wrote the review', required: false })
  @Column({ nullable: true })
  patientId?: string;

  @ApiProperty({ description: 'User being reviewed (e.g. Doctor, biotech Engineer)', required: false })
  @Column({ nullable: true })
  revieweeUserId?: string;

  @ApiProperty({ description: 'User who wrote the review', required: false })
  @Column({ nullable: true })
  reviewerUserId?: string;

  @ApiProperty({ description: 'Center who wrote the review (e.g. Hospital reviewing an engineer)', required: false })
  @Column({ nullable: true })
  reviewerCenterId?: string;

  @ApiProperty({ description: 'Link to the service request or appointment', required: false })
  @Column({ nullable: true })
  requestId?: string;

  @ApiProperty({ description: 'Appointment ID if review is appointment-based', required: false })
  @Column({ nullable: true })
  appointmentId?: string;

  @ApiProperty({ description: 'Overall rating (1-5 stars)', minimum: 1, maximum: 5 })
  @Column({ type: 'decimal', precision: 2, scale: 1 })
  overallRating: number;

  @ApiProperty({ description: 'Staff friendliness rating (1-5)', minimum: 1, maximum: 5, required: false })
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  staffRating?: number;

  @ApiProperty({ description: 'Facility cleanliness rating (1-5)', minimum: 1, maximum: 5, required: false })
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  cleanlinessRating?: number;

  @ApiProperty({ description: 'Wait time satisfaction rating (1-5)', minimum: 1, maximum: 5, required: false })
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  waitTimeRating?: number;

  @ApiProperty({ description: 'Treatment quality rating (1-5)', minimum: 1, maximum: 5, required: false })
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  treatmentRating?: number;

  @ApiProperty({ description: 'Review title', required: false })
  @Column({ length: 200, nullable: true })
  title?: string;

  @ApiProperty({ description: 'Review text content', required: false })
  @Column({ type: 'text', nullable: true })
  content?: string;

  @ApiProperty({ description: 'Whether the review is anonymous' })
  @Column({ default: false })
  isAnonymous: boolean;

  @ApiProperty({ description: 'Whether the review is verified (appointment-based)' })
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Review status for moderation' })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'pending' 
  })
  status: 'pending' | 'approved' | 'rejected' | 'flagged';

  @ApiProperty({ description: 'Photo URLs attached to review', required: false })
  @Column({ type: 'jsonb', nullable: true })
  photos?: string[];

  @ApiProperty({ description: 'Helpful votes count' })
  @Column({ default: 0 })
  helpfulVotes: number;

  @ApiProperty({ description: 'Total votes count' })
  @Column({ default: 0 })
  totalVotes: number;

  @ApiProperty({ description: 'Whether review was edited' })
  @Column({ default: false })
  isEdited: boolean;

  @ApiProperty({ description: 'Last edit timestamp', required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  editedAt?: Date;

  @ApiProperty({ description: 'Moderation notes', required: false })
  @Column({ type: 'text', nullable: true })
  moderationNotes?: string;

  @ApiProperty({ description: 'User who moderated the review', required: false })
  @Column({ nullable: true })
  moderatedBy?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => HealthcareCenter, { nullable: true })
  @JoinColumn({ name: 'centerId' })
  center?: HealthcareCenter;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient?: Patient;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'revieweeUserId' })
  revieweeUser?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewerUserId' })
  reviewerUser?: User;

  @ManyToOne(() => HealthcareCenter, { nullable: true })
  @JoinColumn({ name: 'reviewerCenterId' })
  reviewerCenter?: HealthcareCenter;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'moderatedBy' })
  moderator?: User;

  @OneToOne(() => ReviewResponse, response => response.review)
  response?: ReviewResponse;

  @OneToMany(() => ReviewVote, vote => vote.review)
  votes: ReviewVote[];
}

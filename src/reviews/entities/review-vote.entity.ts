
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Review } from './review.entity';
import { User } from '../../users/entities/user.entity';

@Entity('review_votes')
@Index(['reviewId'])
@Index(['userId'])
@Unique(['reviewId', 'userId'])
export class ReviewVote {
  @ApiProperty({ description: 'Unique identifier for the vote' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Review being voted on' })
  @Column()
  reviewId: string;

  @ApiProperty({ description: 'User who cast the vote' })
  @Column()
  userId: string;

  @ApiProperty({ description: 'Whether the vote is helpful' })
  @Column()
  isHelpful: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Review)
  @JoinColumn({ name: 'reviewId' })
  review: Review;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}

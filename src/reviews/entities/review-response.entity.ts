
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Review } from './review.entity';
import { User } from '../../users/entities/user.entity';

@Entity('review_responses')
export class ReviewResponse {
  @ApiProperty({ description: 'Unique identifier for the review response' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Review this response belongs to' })
  @Column()
  reviewId: string;

  @ApiProperty({ description: 'Response content' })
  @Column({ type: 'text' })
  content: string;

  @ApiProperty({ description: 'User who wrote the response (center staff)' })
  @Column()
  respondedBy: string;

  @ApiProperty({ description: 'Response status' })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'active' 
  })
  status: 'active' | 'edited' | 'deleted';

  @ApiProperty({ description: 'Whether response was edited' })
  @Column({ default: false })
  isEdited: boolean;

  @ApiProperty({ description: 'Last edit timestamp', required: false })
  @Column({ type: 'timestamp with time zone', nullable: true })
  editedAt?: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToOne(() => Review, review => review.response)
  @JoinColumn({ name: 'reviewId' })
  review: Review;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'respondedBy' })
  responder: User;
}

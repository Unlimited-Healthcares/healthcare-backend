
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Review } from './review.entity';

@Entity('review_photos')
@Index(['reviewId'])
export class ReviewPhoto {
  @ApiProperty({ description: 'Unique identifier for the photo' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Review this photo belongs to' })
  @Column()
  reviewId: string;

  @ApiProperty({ description: 'Photo URL' })
  @Column()
  photoUrl: string;

  @ApiProperty({ description: 'Photo caption or description' })
  @Column({ nullable: true })
  caption?: string;

  @ApiProperty({ description: 'Display order' })
  @Column({ default: 0 })
  displayOrder: number;

  @ApiProperty({ description: 'Photo file size in bytes' })
  @Column({ nullable: true })
  fileSize?: number;

  @ApiProperty({ description: 'Photo dimensions' })
  @Column({ type: 'jsonb', nullable: true })
  dimensions?: { width: number; height: number };

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => Review)
  @JoinColumn({ name: 'reviewId' })
  review: Review;
}

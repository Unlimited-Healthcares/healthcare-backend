import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('community_posts')
export class CommunityPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  video?: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  comments: number;

  @Column({
    type: 'enum',
    enum: ['discussion', 'article', 'event', 'job'],
    default: 'discussion',
  })
  type: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

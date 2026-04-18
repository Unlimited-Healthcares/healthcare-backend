import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'center_id', nullable: true })
  centerId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column()
  type: string; // 'appointment', 'medical_record', 'system', 'referral', 'payment'

  @Column({ name: 'delivery_method', default: 'in_app' })
  deliveryMethod: string; // 'in_app', 'email', 'sms', 'push', 'all'

  @Column({ name: 'related_type', nullable: true })
  relatedType: string; // 'appointment', 'medical_record', etc.

  @Column({ name: 'related_id', nullable: true })
  relatedId: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown>;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'is_urgent', default: false })
  isUrgent: boolean;

  @Column({ name: 'read_at', nullable: true })
  readAt: Date;

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date;

  @Column({ name: 'scheduled_for', nullable: true })
  scheduledFor: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ name: 'delivery_status', default: 'pending' })
  deliveryStatus: string; // 'pending', 'sent', 'delivered', 'failed'

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

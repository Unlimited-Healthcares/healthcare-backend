
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'phone_verified', default: false })
  phoneVerified: boolean;

  // Notification type preferences
  @Column({ name: 'medical_record_request', default: 'both' })
  medicalRecordRequest: string; // 'none', 'email', 'push', 'both'

  @Column({ name: 'medical_record_access', default: 'both' })
  medicalRecordAccess: string;

  @Column({ name: 'record_share_expiring', default: 'both' })
  recordShareExpiring: string;

  @Column({ name: 'appointment', default: 'both' })
  appointment: string;

  @Column({ name: 'message', default: 'both' })
  message: string;

  @Column({ name: 'system', default: 'both' })
  system: string;

  @Column({ name: 'referral', default: 'both' })
  referral: string;

  @Column({ name: 'test_result', default: 'both' })
  testResult: string;

  @Column({ name: 'payment', default: 'both' })
  payment: string;

  @Column({ name: 'marketing', default: 'none' })
  marketing: string;

  // Timing preferences
  @Column({ name: 'quiet_hours_start', nullable: true })
  quietHoursStart: string; // '22:00'

  @Column({ name: 'quiet_hours_end', nullable: true })
  quietHoursEnd: string; // '08:00'

  @Column({ name: 'timezone', default: 'UTC' })
  timezone: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

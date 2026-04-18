import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { JsonObject } from '../../types/common';

@Entity('user_activity_logs')
export class UserActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'activity_type' })
  activityType: string;

  @Column({ name: 'activity_description', nullable: true })
  activityDescription: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: JsonObject;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

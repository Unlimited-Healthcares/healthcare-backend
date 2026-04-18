import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { JsonObject } from '../../types/common';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_user_id' })
  adminUserId: string;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ name: 'target_type', nullable: true })
  targetType: string;

  @Column({ name: 'target_id', nullable: true })
  targetId: string;

  @Column({ name: 'action_description' })
  actionDescription: string;

  @Column({ type: 'jsonb', name: 'old_values', nullable: true })
  oldValues: JsonObject | null;

  @Column({ type: 'jsonb', name: 'new_values', nullable: true })
  newValues: JsonObject | null;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ default: true })
  success: boolean;

  @Column({ name: 'error_message', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: JsonObject;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

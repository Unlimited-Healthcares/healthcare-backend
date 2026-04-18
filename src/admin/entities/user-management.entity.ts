
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
  PENDING_VERIFICATION = 'pending_verification',
}

@Entity('user_management')
export class UserManagement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', unique: true })
  userId: string;

  @Column({ 
    type: 'enum', 
    enum: AccountStatus,
    name: 'account_status',
    default: AccountStatus.ACTIVE 
  })
  accountStatus: AccountStatus;

  @Column({ name: 'suspended_until', nullable: true })
  suspendedUntil: Date;

  @Column({ name: 'suspension_reason', nullable: true })
  suspensionReason: string;

  @Column({ name: 'last_login', nullable: true })
  lastLogin: Date;

  @Column({ name: 'login_count', default: 0 })
  loginCount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ name: 'managed_by', nullable: true })
  managedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

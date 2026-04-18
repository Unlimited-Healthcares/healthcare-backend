import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('data_deletion_requests')
export class DataDeletionRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'request_date' })
  requestDate: Date;

  @Column({ name: 'reason', nullable: true, type: 'text' })
  reason: string;

  @Column({ name: 'status' })
  @Index()
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

  @Column({ name: 'completed_date', nullable: true })
  completedDate: Date;

  @Column({ name: 'rejected_reason', nullable: true, type: 'text' })
  rejectedReason: string;

  @Column({ name: 'processed_by', nullable: true })
  processedBy: string;

  @Column({ name: 'verification_code', nullable: true })
  verificationCode: string;

  @Column({ name: 'verification_date', nullable: true })
  verificationDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 
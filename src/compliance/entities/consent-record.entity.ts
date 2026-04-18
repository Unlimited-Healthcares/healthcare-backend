import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('consent_records')
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'consent_type' })
  @Index()
  consentType: string;

  @Column({ name: 'consent_given' })
  consentGiven: boolean;

  @Column({ name: 'consent_date' })
  consentDate: Date;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent: string;

  @Column({ name: 'consent_version', nullable: true })
  consentVersion: string;

  @Column({ name: 'expiry_date', nullable: true })
  expiryDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  additionalInfo: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 
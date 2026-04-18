
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BloodDonor } from './blood-donor.entity';
import { User } from '../../users/entities/user.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('donor_verification')
export class DonorVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'donor_id' })
  donorId: string;

  @Column({ name: 'verification_type' })
  verificationType: string;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  status: VerificationStatus;

  @Column({ type: 'jsonb', default: [] })
  documents: string[];

  @Column({ name: 'verified_by', nullable: true })
  verifiedBy: string;

  @Column({ name: 'verified_at', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BloodDonor, donor => donor.verifications)
  @JoinColumn({ name: 'donor_id' })
  donor: BloodDonor;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'verified_by' })
  verifier: User;
}

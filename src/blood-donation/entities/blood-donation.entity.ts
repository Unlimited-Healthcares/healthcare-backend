import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BloodDonor } from './blood-donor.entity';
import { BloodType } from '../enums/blood-type.enum';
import { BloodDonationRequest } from './blood-donation-request.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { User } from '../../users/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';
import { BloodDonationData } from '../../types/medical.types';

export enum DonationStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('blood_donations')
export class BloodDonation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'donation_number', unique: true })
  donationNumber: string;

  @Column({ name: 'donor_id' })
  donorId: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ name: 'blood_bank_center_id' })
  bloodBankCenterId: string;

  @Column({ name: 'donation_date', default: () => 'now()' })
  donationDate: Date;

  @Column({ type: 'enum', enum: BloodType, name: 'blood_type' })
  bloodType: BloodType;

  @Column({ name: 'volume_ml', default: 450 })
  volumeMl: number;

  @Column({ type: 'enum', enum: DonationStatus, default: DonationStatus.SCHEDULED })
  status: DonationStatus;

  @Column({ type: 'jsonb', name: 'pre_donation_vitals', nullable: true })
  preDonationVitals: Record<string, string | number>;

  @Column({ type: 'jsonb', name: 'post_donation_vitals', nullable: true })
  postDonationVitals: Record<string, string | number>;

  @ApiProperty({ description: 'Pre-donation screening results' })
  @Column('jsonb', { nullable: true })
  preScreeningResults: BloodDonationData['healthScreening'];

  @ApiProperty({ description: 'Post-donation monitoring data' })
  @Column('jsonb', { nullable: true })
  postDonationMonitoring: Record<string, unknown>;

  @ApiProperty({ description: 'Additional notes' })
  @Column('jsonb', { default: {} })
  notes: Record<string, unknown>;

  @Column({ name: 'staff_notes', nullable: true })
  staffNotes: string;

  @Column({ name: 'compensation_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  compensationAmount: number;

  @Column({ name: 'payment_status', default: 'pending' })
  paymentStatus: string;

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Column({ name: 'expiry_date', nullable: true })
  expiryDate: Date;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BloodDonor, donor => donor.donations)
  @JoinColumn({ name: 'donor_id' })
  donor: BloodDonor;

  @ManyToOne(() => BloodDonationRequest, request => request.donations)
  @JoinColumn({ name: 'request_id' })
  request: BloodDonationRequest;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'blood_bank_center_id' })
  bloodBankCenter: HealthcareCenter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;
}

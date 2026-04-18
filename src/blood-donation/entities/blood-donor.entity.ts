import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BloodDonation } from './blood-donation.entity';
import { DonorReward } from './donor-reward.entity';
import { DonorVerification } from './donor-verification.entity';
import { DonationAppointment } from './donation-appointment.entity';
import { BloodType } from '../enums/blood-type.enum';

export enum DonorStatus {
  ELIGIBLE = 'eligible',
  TEMPORARILY_DEFERRED = 'temporarily_deferred',
  PERMANENTLY_DEFERRED = 'permanently_deferred',
  SUSPENDED = 'suspended',
}

@Entity('blood_donors')
export class BloodDonor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'donor_number', unique: true })
  donorNumber: string;

  @Column({ type: 'enum', enum: BloodType, name: 'blood_type' })
  bloodType: BloodType;

  @Column({ name: 'weight_kg', type: 'decimal', precision: 5, scale: 2, nullable: true })
  weightKg: number;

  @Column({ name: 'height_cm', nullable: true })
  heightCm: number;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: Date;

  @Column({ name: 'emergency_contact_name', nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', nullable: true })
  emergencyContactPhone: string;

  @Column({ type: 'jsonb', name: 'medical_conditions', default: [] })
  medicalConditions: string[];

  @Column({ type: 'jsonb', default: [] })
  medications: string[];

  @Column({ name: 'last_donation_date', nullable: true })
  lastDonationDate: Date;

  @Column({ name: 'next_eligible_date', nullable: true })
  nextEligibleDate: Date;

  @Column({ name: 'total_donations', default: 0 })
  totalDonations: number;

  @Column({ name: 'total_reward_points', default: 0 })
  totalRewardPoints: number;

  @Column({ type: 'enum', enum: DonorStatus, default: DonorStatus.ELIGIBLE })
  status: DonorStatus;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => BloodDonation, donation => donation.donor)
  donations: BloodDonation[];

  @OneToMany(() => DonorReward, reward => reward.donor)
  rewards: DonorReward[];

  @OneToMany(() => DonorVerification, verification => verification.donor)
  verifications: DonorVerification[];

  @OneToMany(() => DonationAppointment, appointment => appointment.donor)
  appointments: DonationAppointment[];
}

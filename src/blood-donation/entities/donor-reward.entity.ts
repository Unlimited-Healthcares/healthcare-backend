
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BloodDonor } from './blood-donor.entity';
import { BloodDonation } from './blood-donation.entity';

@Entity('donor_rewards')
export class DonorReward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'donor_id' })
  donorId: string;

  @Column({ name: 'reward_type' })
  rewardType: string;

  @Column({ name: 'points_earned' })
  pointsEarned: number;

  @Column({ name: 'points_redeemed', default: 0 })
  pointsRedeemed: number;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'donation_id', nullable: true })
  donationId: string;

  @Column({ name: 'expires_at', nullable: true })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => BloodDonor, donor => donor.rewards)
  @JoinColumn({ name: 'donor_id' })
  donor: BloodDonor;

  @ManyToOne(() => BloodDonation)
  @JoinColumn({ name: 'donation_id' })
  donation: BloodDonation;
}

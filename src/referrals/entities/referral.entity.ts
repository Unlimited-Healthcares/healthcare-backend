import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { ReferralDocument } from './referral-document.entity';

export enum ReferralStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}

export enum ReferralPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ReferralType {
  SPECIALIST = 'specialist',
  DIAGNOSTIC = 'diagnostic',
  PROCEDURE = 'procedure',
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  SECOND_OPINION = 'second_opinion',
  TRANSFER = 'transfer',
}

interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  [key: string]: unknown;
}

interface AllergyInfo {
  allergen: string;
  reaction: string;
  severity: string;
  [key: string]: unknown;
}

@Entity('referrals')
export class Referral {
  @ApiProperty({ description: 'Unique identifier for the referral' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Patient ID' })
  @Column()
  patientId: string;

  @ApiProperty({ description: 'Referring provider/doctor ID' })
  @Column()
  referringProviderId: string;

  @ApiProperty({ description: 'The healthcare center that is making the referral' })
  @Column()
  referringCenterId: string;

  @ApiProperty({ description: 'The healthcare center the patient is being referred to' })
  @Column()
  receivingCenterId: string;

  @ApiProperty({ description: 'Specific provider being referred to (optional)' })
  @Column({ nullable: true })
  receivingProviderId: string;

  @ApiProperty({ description: 'Referral type', enum: ReferralType })
  @Column({ type: 'enum', enum: ReferralType, default: ReferralType.SPECIALIST })
  referralType: ReferralType;

  @ApiProperty({ description: 'Referral status', enum: ReferralStatus })
  @Column({ type: 'enum', enum: ReferralStatus, default: ReferralStatus.PENDING })
  status: ReferralStatus;

  @ApiProperty({ description: 'Referral priority', enum: ReferralPriority })
  @Column({ type: 'enum', enum: ReferralPriority, default: ReferralPriority.NORMAL })
  priority: ReferralPriority;

  @ApiProperty({ description: 'Reason/purpose for the referral' })
  @Column({ type: 'text' })
  reason: string;

  @ApiProperty({ description: 'Clinical notes and details about the referral' })
  @Column({ type: 'text', nullable: true })
  clinicalNotes: string;

  @ApiProperty({ description: 'Diagnosis related to the referral' })
  @Column({ nullable: true })
  diagnosis: string;

  @ApiProperty({ description: 'Instructions for the receiving provider' })
  @Column({ type: 'text', nullable: true })
  instructions: string;

  @ApiProperty({ description: 'When the referral should be scheduled by' })
  @Column({ nullable: true })
  scheduledDate: Date;

  @ApiProperty({ description: 'Expiration date for the referral' })
  @Column({ nullable: true })
  expirationDate: Date;

  @ApiProperty({ description: 'Additional metadata about the referral' })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @ApiProperty({ description: 'Any medications the patient is currently taking' })
  @Column({ type: 'jsonb', nullable: true })
  medications: MedicationInfo[];

  @ApiProperty({ description: 'Any allergies the patient has' })
  @Column({ type: 'jsonb', nullable: true })
  allergies: AllergyInfo[];

  @ApiProperty({ description: 'Medical history relevant to the referral' })
  @Column({ type: 'text', nullable: true })
  medicalHistory: string;

  @ApiProperty({ description: 'Date the referral was responded to' })
  @Column({ nullable: true })
  respondedDate: Date;

  @ApiProperty({ description: 'Response notes from receiving provider' })
  @Column({ type: 'text', nullable: true })
  responseNotes: string;

  @ApiProperty({ description: 'ID of the user who responded to the referral' })
  @Column({ nullable: true })
  respondedById: string;

  @ApiProperty({ description: 'ID of the chat room associated with this referral' })
  @Column({ nullable: true })
  chatRoomId: string;

  @ApiProperty({ description: 'Timestamp of when the referral was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp of when the referral was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referringProviderId' })
  referringProvider: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receivingProviderId' })
  receivingProvider: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'respondedById' })
  respondedBy: User;

  @OneToMany(() => ReferralDocument, document => document.referral)
  documents: ReferralDocument[];
} 
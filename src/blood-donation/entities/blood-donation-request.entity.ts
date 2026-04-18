import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { User } from '../../users/entities/user.entity';
import { BloodDonation } from './blood-donation.entity';
import { BloodType } from '../enums/blood-type.enum';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum RequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('blood_donation_requests')
export class BloodDonationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_number', unique: true })
  requestNumber: string;

  @Column({ name: 'requesting_center_id' })
  requestingCenterId: string;

  @Column({ name: 'patient_name', nullable: true })
  patientName: string;

  @Column({ name: 'patient_age', nullable: true })
  patientAge: number;

  @Column({ type: 'enum', enum: BloodType, name: 'blood_type' })
  bloodType: BloodType;

  @Column({ name: 'units_needed', default: 1 })
  unitsNeeded: number;

  @Column({ name: 'units_fulfilled', default: 0 })
  unitsFulfilled: number;

  @Column({ type: 'enum', enum: RequestPriority, default: RequestPriority.MEDIUM })
  priority: RequestPriority;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ name: 'needed_by' })
  neededBy: Date;

  @Column({ name: 'medical_condition', nullable: true })
  medicalCondition: string;

  @Column({ name: 'special_requirements', nullable: true })
  specialRequirements: string;

  @Column({ name: 'contact_person', nullable: true })
  contactPerson: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'fulfilled_at', nullable: true })
  fulfilledAt: Date;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'requesting_center_id' })
  requestingCenter: HealthcareCenter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approved_by' })
  approver: User;

  @OneToMany(() => BloodDonation, donation => donation.request)
  donations: BloodDonation[];
}

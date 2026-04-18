
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @OneToOne(() => User, user => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  displayName: string;

  @ApiProperty({ example: 'Experienced surgeon with 10 years of practice.', description: 'Professional bio' })
  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  bloodGroup: string;

  @Column({ nullable: true })
  genotype: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ nullable: true })
  specialization: string; // For doctors

  @Column({ nullable: true })
  practiceNumber: string; // For medical professionals

  @Column({ nullable: true })
  governmentIdType: string; // e.g. "National Identity Card (NIN)"

  @Column({ nullable: true })
  governmentIdNumber: string; // The actual ID number

  @Column({ nullable: true, type: 'text' })
  governmentIdDoc: string; // Base64-encoded image/PDF of the uploaded ID card

  @Column({ nullable: true })
  experience: string;

  // Discovery system fields
  @Column({ type: 'jsonb', nullable: true })
  qualifications: string[];

  @Column({ type: 'jsonb', nullable: true })
  location: {
    city: string;
    state: string;
    country: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number }
  };

  @Column({ type: 'jsonb', nullable: true })
  availability: {
    schedule: Record<string, { start: string; end: string }>;
    timezone: string
  };

  @Column({ type: 'jsonb', nullable: true })
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'professional_only';
    dataSharing: Record<string, boolean>;
    contactPreferences: Record<string, boolean>;
  };

  // Professional practice details (for doctors/nurses)
  @Column({ type: 'jsonb', nullable: true })
  professionalPractice: {
    practiceName: string;        // e.g. "Medical Certification", "MBBS Certificate"
    practiceNumber: string;     // The practice/registration number
    certifyingBody: string;     // e.g. "Medical and Dental Council of Nigeria"
    issuanceDate: string;       // ISO date string
    expiryDate?: string | null; // ISO date string, null if no expiry
  };

  // Business registration details (for centers/facilities)
  @Column({ type: 'jsonb', nullable: true })
  businessRegistration: {
    registrationNumber: string;   // Business registration number
    certificateName: string;      // e.g. "CAC Certificate", "Health Facility License"
    dateIssued: string;           // ISO date string
    expiryDate?: string | null;   // ISO date string, null if no expiry
  };

  // Employment info (for staff)
  @Column({ type: 'jsonb', nullable: true })
  staffInfo: {
    jobTitle?: string;            // e.g. "Registered Nurse", "Lab Technician"
    department?: string;          // e.g. "Emergency", "Cardiology"
    employeeId?: string;          // e.g. "EMP-00123"
    employmentStartDate?: string; // ISO date string
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };

  @Column({ type: 'jsonb', nullable: true })
  services: Array<{
    id?: string;
    name: string;
    description?: string;
    category?: string;
    price?: number;
    currency?: string;
    is_available?: boolean;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  certificates: Array<{
    name: string;
    issuer: string;
    issueDate?: string;
    expiryDate?: string;
    url?: string;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  paymentSettings: {
    requireUpfrontPayment: boolean;
    consultationFee?: number;
    appointmentFee?: number;
    serviceFee?: number;
    currency?: string;
    methods: Array<{
      type: 'paystack' | 'flutterwave' | 'stripe';
      label: string;
      details: {
        subaccount: string; // The subaccount code (for Paystack/Flutterwave/Stripe)
        [key: string]: unknown;
      };
      instructions?: string;
    }>;
  };

  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    notifications: boolean;
    emailUpdates: boolean;
    smsUpdates: boolean;
    pushNotifications: boolean;
    language: string;
    timezone: string;
    biometricEnabled?: boolean;
  };

  @Column({ nullable: true, default: 'basic' })
  subscriptionPlan: string;

  @Column({ nullable: true })
  subscriptionStatus: string; // e.g. 'active', 'expired'

  @Column({ nullable: true })
  subscriptionExpiry: Date;


  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CenterStaff } from './center-staff.entity';
import { CenterService } from './center-service.entity';
import { CenterAvailability } from './center-availability.entity';
import { ApiProperty } from '@nestjs/swagger';
import { CenterType } from '../enum/center-type.enum';
import { GeoPoint } from '../../types/common.types';

@Entity('healthcare_centers')
export class HealthcareCenter {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'HSP123456789', description: 'Human-readable display ID' })
  @Column({ name: 'display_id', unique: true, nullable: true })
  displayId: string;

  @ApiProperty({ example: 'General Hospital', description: 'Center name' })
  @Column()
  name: string;

  @ApiProperty({ example: 'https://example.com/logo.png', description: 'Center logo URL', required: false })
  @Column({ name: 'logo_url', nullable: true })
  logoUrl: string;

  @ApiProperty({ example: 'Providing quality healthcare services since 1990.', description: 'Center description' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    example: 'hospital',
    description: 'Center type',
    enum: CenterType
  })
  @Column()
  type: string;

  @ApiProperty({ example: '123 Main St, City, State', description: 'Center address' })
  @Column()
  address: string;

  @ApiProperty({ example: 40.7128, description: 'Latitude coordinate', required: false })
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @ApiProperty({ example: -74.0060, description: 'Longitude coordinate', required: false })
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: GeoPoint;

  @ApiProperty({ example: 'New York', description: 'City name', required: false })
  @Column({ nullable: true })
  city: string;

  @ApiProperty({ example: 'NY', description: 'State/Province', required: false })
  @Column({ nullable: true })
  state: string;

  @ApiProperty({ example: 'United States', description: 'Country', required: false })
  @Column({ nullable: true })
  country: string;

  @ApiProperty({ example: '10001', description: 'Postal/ZIP code', required: false })
  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @ApiProperty({ example: '123-456-7890', description: 'Phone number', required: false })
  @Column({ nullable: true })
  phone: string;

  @ApiProperty({ example: 'info@hospital.com', description: 'Email address', required: false })
  @Column({ nullable: true })
  email: string;

  @ApiProperty({ example: '9:00 AM - 5:00 PM', description: 'Operating hours', required: false })
  @Column({ nullable: true })
  hours: string;

  @ApiProperty({ example: 'RC1234567', description: 'Business registration number', required: false })
  @Column({ name: 'business_registration_number', nullable: true })
  businessRegNumber: string;

  @ApiProperty({ example: 'https://example.com/certificate.pdf', description: 'Business registration certificate URL', required: false })
  @Column({ name: 'business_registration_doc_url', nullable: true })
  businessRegCertificateUrl: string;

  @ApiProperty({
    description: 'Business registration details (for centers/facilities)',
    required: false,
    type: 'object'
  })
  @Column({ type: 'jsonb', nullable: true })
  businessRegistration: {
    registrationNumber: string;   // Business registration number
    certificateName: string;      // e.g. "CAC Certificate", "Health Facility License"
    dateIssued: string;           // ISO date string
    expiryDate?: string | null;   // ISO date string, null if no expiry
  };

  @ApiProperty({ example: '123-456-7890', description: 'Emergency contact number', required: false })
  @Column({ name: 'emergency_contact', nullable: true })
  emergencyContact: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Owner user ID', required: false })
  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId: string;

  @ApiProperty({ example: 'PRAC123456', description: 'Professional practice number', required: false })
  @Column({ name: 'practice_number', nullable: true })
  practiceNumber: string;

  @ApiProperty({ example: '2025-12-31', description: 'Practice number expiry date', required: false })
  @Column({ name: 'practiceExpiry', type: 'date', nullable: true })
  practiceExpiry: Date;

  @ApiProperty({
    description: 'Location metadata including timezone, elevation, accuracy, etc.',
    required: false,
    type: 'object'
  })
  @Column({ type: 'jsonb', nullable: true })
  locationMetadata: Record<string, unknown>;

  @ApiProperty({ example: true, description: 'Whether the center is active' })
  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ApiProperty({ type: () => [CenterStaff], description: 'Center staff members' })
  @OneToMany(() => CenterStaff, staff => staff.center)
  staff: CenterStaff[];

  @ApiProperty({ type: () => [CenterService], description: 'Services offered by the center' })
  @OneToMany(() => CenterService, service => service.center)
  services: CenterService[];

  @ApiProperty({ type: () => [CenterAvailability], description: 'Center availability schedule' })
  @OneToMany(() => CenterAvailability, availability => availability.center)
  availability: CenterAvailability[];

  @ApiProperty({
    description: 'Payment settings for the center, allowing them to define their own payment methods and rules.',
    required: false,
    type: 'object'
  })
  @Column({ type: 'jsonb', nullable: true })
  paymentSettings: {
    requireUpfrontPayment: boolean;
    consultationFee?: number;
    appointmentFee?: number;
    serviceFee?: number;
    currency?: string;
    methods: Array<{
      type: 'paystack' | 'flutterwave' | 'stripe' | 'binance';
      label: string;
      details: {
        subaccount: string; // The subaccount code (for Paystack/Flutterwave/Stripe)
        [key: string]: unknown;
      };
      instructions?: string;
    }>;
  };

  @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}

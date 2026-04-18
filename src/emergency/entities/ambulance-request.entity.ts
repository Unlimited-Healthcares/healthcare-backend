
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ambulance } from './ambulance.entity';

export enum RequestStatus {
  PENDING = 'pending',
  DISPATCHED = 'dispatched',
  ACKNOWLEDGED = 'acknowledged',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  TRANSPORTING = 'transporting',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('ambulance_requests')
export class AmbulanceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'request_number', unique: true })
  requestNumber: string;

  @Column({ name: 'patient_name' })
  patientName: string;

  @Column({ name: 'patient_age', nullable: true })
  patientAge: number;

  @Column({ name: 'patient_gender', nullable: true })
  patientGender: string;

  @Column({ name: 'patient_phone' })
  patientPhone: string;

  @Column({ name: 'emergency_contact_name', nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', nullable: true })
  emergencyContactPhone: string;

  @Column({ name: 'pickup_latitude', type: 'decimal', precision: 10, scale: 8 })
  pickupLatitude: number;

  @Column({ name: 'pickup_longitude', type: 'decimal', precision: 11, scale: 8 })
  pickupLongitude: number;

  @Column({ name: 'pickup_address' })
  pickupAddress: string;

  @Column({ name: 'destination_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  destinationLatitude: number;

  @Column({ name: 'destination_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  destinationLongitude: number;

  @Column({ name: 'destination_address', nullable: true })
  destinationAddress: string;

  @Column({ name: 'medical_condition', type: 'text' })
  medicalCondition: string;

  @Column({ name: 'symptoms', type: 'text', nullable: true })
  symptoms: string;

  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status: RequestStatus;

  @Column({ name: 'special_requirements', type: 'text', nullable: true })
  specialRequirements: string;

  @Column({ name: 'medical_history', type: 'jsonb', nullable: true })
  medicalHistory: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    blood_type?: string;
  };

  @Column({ name: 'requested_by', nullable: true })
  requestedBy: string;

  @Column({ name: 'ambulance_id', nullable: true })
  ambulanceId: string;

  @ManyToOne(() => Ambulance, (ambulance) => ambulance.requests)
  @JoinColumn({ name: 'ambulance_id' })
  ambulance: Ambulance;

  @Column({ name: 'dispatched_at', nullable: true })
  dispatchedAt: Date;

  @Column({ name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date;

  @Column({ name: 'arrived_at', nullable: true })
  arrivedAt: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt: Date;

  @Column({ name: 'estimated_arrival', nullable: true })
  estimatedArrival: Date;

  @Column({ name: 'actual_arrival', nullable: true })
  actualArrival: Date;

  @Column({ name: 'total_cost', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCost: number;

  @Column({ name: 'insurance_info', type: 'jsonb', nullable: true })
  insuranceInfo: {
    provider?: string;
    policy_number?: string;
    group_number?: string;
  };

  @Column({ name: 'team_details', type: 'jsonb', nullable: true })
  teamDetails: Array<{
    name?: string;
    idNumber?: string;
    role: string;
  }>;

  @Column({ name: 'patient_condition', nullable: true })
  patientCondition: string;

  @Column({ name: 'delivery_details', type: 'jsonb', nullable: true })
  deliveryDetails: {
    hospitalName?: string;
    receiverName?: string;
    receiverPhone?: string;
    receiverEmail?: string;
  };

  @Column({ name: 'moving_at', nullable: true })
  movingAt: Date;

  @Column({ name: 'tracking_number', nullable: true })
  trackingNumber: string;

  @Column({ name: 'seen_at', nullable: true })
  seenAt: Date;

  @Column({ name: 'delivered_at', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

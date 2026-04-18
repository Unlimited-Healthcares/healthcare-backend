
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AlertType {
  SOS = 'sos',
  MEDICAL_EMERGENCY = 'medical_emergency',
  ACCIDENT = 'accident',
  FIRE = 'fire',
  NATURAL_DISASTER = 'natural_disaster',
  SECURITY_THREAT = 'security_threat',
  PANIC = 'panic',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESPONDING = 'responding',
  RESOLVED = 'resolved',
  FALSE_ALARM = 'false_alarm',
  CANCELLED = 'cancelled',
}

@Entity('emergency_alerts')
export class EmergencyAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alert_number', unique: true, nullable: true })
  alertNumber: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ nullable: true })
  address: string;

  @Column({ name: 'contact_number', nullable: true })
  contactNumber: string;

  @Column({ name: 'emergency_contacts', type: 'jsonb', nullable: true })
  emergencyContacts: Array<{
    name: string;
    phone: string;
    email?: string;
    relationship: string;
    is_primary: boolean;
  }>;

  @Column({ name: 'medical_info', type: 'jsonb', nullable: true })
  medicalInfo: {
    blood_type?: string;
    allergies?: string[];
    medications?: string[];
    medical_conditions?: string[];
    emergency_medical_notes?: string;
  };

  @Column({ name: 'responder_ids', type: 'jsonb', nullable: true })
  responderIds: string[];

  @Column({ name: 'acknowledged_at', nullable: true })
  acknowledgedAt: Date;

  @Column({ name: 'acknowledged_by', nullable: true })
  acknowledgedBy: string;

  @Column({ name: 'response_time_minutes', nullable: true })
  responseTimeMinutes: number;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy: string;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ name: 'is_test_alert', default: false })
  isTestAlert: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

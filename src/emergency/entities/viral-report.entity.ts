
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ViralReportType {
  OUTBREAK_REPORT = 'outbreak_report',
  EXPOSURE_REPORT = 'exposure_report',
  SYMPTOM_REPORT = 'symptom_report',
  CONTACT_TRACE = 'contact_trace',
  RECOVERY_REPORT = 'recovery_report',
}

export enum ReportStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  INVESTIGATED = 'investigated',
  CLOSED = 'closed',
  DISMISSED = 'dismissed',
}

@Entity('viral_reports')
export class ViralReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_number', unique: true })
  reportNumber: string;

  @Column({
    type: 'enum',
    enum: ViralReportType,
  })
  type: ViralReportType;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.SUBMITTED,
  })
  status: ReportStatus;

  @Column({ name: 'reported_by', nullable: true })
  reportedBy: string;

  @Column({ name: 'is_anonymous', default: false })
  isAnonymous: boolean;

  @Column({ name: 'disease_type' })
  diseaseType: string;

  @Column({ name: 'symptoms', type: 'jsonb' })
  symptoms: string[];

  @Column({ name: 'onset_date', nullable: true })
  onsetDate: Date;

  @Column({ name: 'exposure_date', nullable: true })
  exposureDate: Date;

  @Column({ name: 'location_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  locationLatitude: number;

  @Column({ name: 'location_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  locationLongitude: number;

  @Column({ name: 'location_address', nullable: true })
  locationAddress: string;

  @Column({ name: 'contact_information', type: 'jsonb', nullable: true })
  contactInformation: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
  };

  @Column({ name: 'affected_count', default: 1 })
  affectedCount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'risk_factors', type: 'jsonb', nullable: true })
  riskFactors: string[];

  @Column({ name: 'preventive_measures', type: 'jsonb', nullable: true })
  preventiveMeasures: string[];

  @Column({ name: 'healthcare_facility_visited', nullable: true })
  healthcareFacilityVisited: string;

  @Column({ name: 'test_results', type: 'jsonb', nullable: true })
  testResults: {
    test_type?: string;
    result?: string;
    test_date?: Date;
    lab_name?: string;
  };

  @Column({ name: 'health_authority_notified', default: false })
  healthAuthorityNotified: boolean;

  @Column({ name: 'notification_sent_at', nullable: true })
  notificationSentAt: Date;

  @Column({ name: 'investigated_by', nullable: true })
  investigatedBy: string;

  @Column({ name: 'investigation_notes', type: 'text', nullable: true })
  investigationNotes: string;

  @Column({ name: 'public_health_actions', type: 'jsonb', nullable: true })
  publicHealthActions: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

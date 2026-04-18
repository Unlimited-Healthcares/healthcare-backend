
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ViralReport } from './viral-report.entity';

export enum ContactType {
  HOUSEHOLD = 'household',
  WORKPLACE = 'workplace',
  SOCIAL = 'social',
  HEALTHCARE = 'healthcare',
  TRAVEL = 'travel',
  OTHER = 'other',
}

export enum ExposureRisk {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

@Entity('contact_traces')
export class ContactTrace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'viral_report_id' })
  viralReportId: string;

  @ManyToOne(() => ViralReport)
  @JoinColumn({ name: 'viral_report_id' })
  viralReport: ViralReport;

  @Column({ name: 'contact_name', nullable: true })
  contactName: string;

  @Column({ name: 'contact_phone', nullable: true })
  contactPhone: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({
    type: 'enum',
    enum: ContactType,
  })
  contactType: ContactType;

  @Column({ name: 'exposure_date' })
  exposureDate: Date;

  @Column({ name: 'exposure_duration_minutes', nullable: true })
  exposureDurationMinutes: number;

  @Column({
    type: 'enum',
    enum: ExposureRisk,
    default: ExposureRisk.MODERATE,
  })
  riskLevel: ExposureRisk;

  @Column({ name: 'exposure_location', nullable: true })
  exposureLocation: string;

  @Column({ name: 'exposure_details', type: 'text', nullable: true })
  exposureDetails: string;

  @Column({ name: 'mask_worn_by_case', nullable: true })
  maskWornByCase: boolean;

  @Column({ name: 'mask_worn_by_contact', nullable: true })
  maskWornByContact: boolean;

  @Column({ name: 'outdoor_exposure', nullable: true })
  outdoorExposure: boolean;

  @Column({ name: 'notified_at', nullable: true })
  notifiedAt: Date;

  @Column({ name: 'quarantine_start_date', nullable: true })
  quarantineStartDate: Date;

  @Column({ name: 'quarantine_end_date', nullable: true })
  quarantineEndDate: Date;

  @Column({ name: 'test_recommended', default: true })
  testRecommended: boolean;

  @Column({ name: 'test_scheduled_date', nullable: true })
  testScheduledDate: Date;

  @Column({ name: 'follow_up_required', default: true })
  followUpRequired: boolean;

  @Column({ name: 'follow_up_completed', default: false })
  followUpCompleted: boolean;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

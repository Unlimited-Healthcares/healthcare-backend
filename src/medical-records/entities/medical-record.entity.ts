import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { MedicalRecordFile } from './medical-record-file.entity';
import { MedicalRecordShare } from './medical-record-share.entity';

@Entity('medical_records')
export class MedicalRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column({ nullable: true })
  centerId: string;

  @Column({ nullable: true })
  createdBy: string;

  @Column({ length: 100 })
  recordType: string; // diagnosis, prescription, lab_result, imaging, surgery, etc.

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  vitals: Record<string, unknown>; // Patient vitals

  @Column({ type: 'jsonb', nullable: true })
  recordData: Record<string, unknown>; // Structured medical data

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]; // Array of tags for categorization

  @Column({ length: 100, nullable: true })
  category: string; // General category like cardiology, neurology, etc.

  @Column({ type: 'text', nullable: true })
  diagnosis: string;

  @Column({ type: 'text', nullable: true })
  treatment: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'text', nullable: true })
  followUp: string;

  @Column({ type: 'jsonb', nullable: true })
  medications: Record<string, unknown> | unknown[];

  @Column({ length: 50, default: 'active' })
  status: string; // active, archived, deleted

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ nullable: true })
  parentRecordId: string;

  @Column({ type: 'boolean', default: false })
  isSensitive: boolean;

  @Column({ type: 'boolean', default: true })
  isShareable: boolean;

  @Column({ type: 'boolean', default: true })
  isLatestVersion: boolean; // Track if this is the latest version of the record

  @Column({ type: 'jsonb', nullable: true })
  sharingRestrictions: Record<string, unknown>; // Specific sharing rules

  @Column({ type: 'simple-array', nullable: true })
  fileAttachments: string[]; // Array of file IDs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => MedicalRecordFile, file => file.record)
  files: MedicalRecordFile[];

  @OneToMany(() => MedicalRecordShare, share => share.record)
  shares: MedicalRecordShare[];
}

import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

@Entity('medical_record_shares')
export class MedicalRecordShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordId: string;

  @Column()
  patientId: string;

  @Column()
  fromCenterId: string;

  @Column()
  toCenterId: string;

  @Column({ nullable: true })
  sharedBy: string;

  @Column({ length: 50, default: 'temporary' })
  shareType: string; // temporary, permanent

  @Column({ length: 50, default: 'view' })
  accessLevel: string; // view, download, edit

  @Column({ type: 'timestamp', nullable: true })
  expiryDate: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  accessConditions: Record<string, unknown>; // Specific access conditions

  @Column({ type: 'jsonb', nullable: true })
  sharedDataScope: Record<string, unknown>; // What parts of the record are shared

  @Column({ length: 255, nullable: true })
  contactPerson: string; // Contact person for this share

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ nullable: true })
  revokedBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MedicalRecord, record => record.shares)
  @JoinColumn({ name: 'recordId' })
  record: MedicalRecord;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sharedBy' })
  sharedByUser: User;
}

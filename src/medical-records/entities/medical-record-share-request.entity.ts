
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

@Entity('medical_record_share_requests')
export class MedicalRecordShareRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordId: string;

  @Column()
  patientId: string;

  @Column()
  requestingCenterId: string;

  @Column()
  owningCenterId: string;

  @Column({ nullable: true })
  requestedBy: string;

  @Column({ type: 'text' })
  purpose: string;

  @Column({ length: 50, default: 'normal' })
  urgencyLevel: string; // urgent, normal, low

  @Column({ length: 50, default: 'pending' })
  requestStatus: string; // pending, approved, denied, expired

  @Column({ length: 50, default: 'view' })
  requestedAccessLevel: string;

  @Column({ type: 'int', default: 30 })
  requestedDurationDays: number;

  @Column({ type: 'text', nullable: true })
  responseNotes: string;

  @Column({ nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MedicalRecord)
  @JoinColumn({ name: 'recordId' })
  record: MedicalRecord;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedBy' })
  requestedByUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approvedBy' })
  approvedByUser: User;
}

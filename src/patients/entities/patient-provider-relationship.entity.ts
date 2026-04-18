import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Patient } from './patient.entity';
import { User } from '../../users/entities/user.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';

@Entity('patient_provider_relationships')
@Index(['patientId', 'providerId', 'providerType'], { unique: true })
export class PatientProviderRelationship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'provider_id' })
  providerId: string;

  @Column({ 
    name: 'provider_type',
    type: 'enum',
    enum: ['doctor', 'center'],
    comment: 'Type of provider: doctor (individual) or center (healthcare facility)'
  })
  providerType: 'doctor' | 'center';

  @Column({ 
    default: 'approved',
    type: 'enum',
    enum: ['pending', 'approved', 'rejected'],
    comment: 'Status of the relationship'
  })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ name: 'approved_at', nullable: true })
  approvedAt: Date;

  @Column({ name: 'approved_by', nullable: true })
  approvedBy: string;

  @Column({ name: 'request_id', nullable: true })
  requestId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @ManyToOne(() => HealthcareCenter, { nullable: true, onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn({ name: 'provider_id' })
  center: HealthcareCenter;

  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'approved_by' })
  approver: User;
}

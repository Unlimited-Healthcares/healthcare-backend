
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, OneToOne } from 'typeorm';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { User } from '../../users/entities/user.entity';

@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  patientId: string; // Generated display ID like PT123456789

  @Column({ unique: true, nullable: true })
  medicalRecordNumber: string;

  @Column({ nullable: true })
  emergencyContactName: string;

  @Column({ nullable: true })
  emergencyContactPhone: string;

  @Column({ nullable: true })
  emergencyContactRelationship: string;

  @Column({ length: 5, nullable: true })
  bloodType: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column('text', { nullable: true })
  allergies: string;

  @Column('text', { nullable: true })
  chronicConditions: string;

  @Column('text', { nullable: true })
  currentMedications: string;

  @Column({ nullable: true })
  insuranceProvider: string;

  @Column({ nullable: true })
  insurancePolicyNumber: string;

  @Column({ default: 'English' })
  preferredLanguage: string;

  @Column({ default: false })
  consentDataSharing: boolean;

  @Column({ default: false })
  consentResearch: boolean;

  @Column({ default: false })
  consentMarketing: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column('jsonb', { nullable: true })
  vitals: {
    heartRate?: number;
    bp?: string;
    temp?: number;
    spO2?: number;
    respiratoryRate?: number;
    lastUpdated?: Date;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => PatientVisit, visit => visit.patient)
  visits: PatientVisit[];
}

@Entity('patient_visits')
export class PatientVisit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  patientId: string;

  @Column()
  centerId: string;

  @Column()
  visitDate: Date;

  @Column()
  visitType: string; // checkup, emergency, followup, etc.

  @Column('text', { nullable: true })
  chiefComplaint: string;

  @Column('text', { nullable: true })
  diagnosis: string;

  @Column('text', { nullable: true })
  treatmentNotes: string;

  @Column('text', { nullable: true })
  prescribedMedications: string;

  @Column({ default: false })
  followUpRequired: boolean;

  @Column({ nullable: true })
  followUpDate: Date;

  @Column({ default: 'completed' })
  visitStatus: string; // scheduled, in_progress, completed, cancelled

  @Column({ nullable: true })
  createdBy: string;

  @ManyToOne(() => Patient, patient => patient.visits)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'centerId' })
  center: HealthcareCenter;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

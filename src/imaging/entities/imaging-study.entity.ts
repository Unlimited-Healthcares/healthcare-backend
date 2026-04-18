import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { ImagingFile } from './imaging-file.entity';

@Entity('imaging_studies')
export class ImagingStudy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'study_instance_uid', unique: true, nullable: true })
  studyInstanceUid: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'study_date', type: 'timestamp', nullable: true })
  studyDate: Date;

  @Column({ nullable: true })
  modality: string; // CT, MRI, XR, US, etc.

  @Column({ name: 'body_part', nullable: true })
  bodyPart: string;

  @Column({ name: 'center_id', nullable: true })
  centerId: string;

  @Column({ name: 'provider_id', nullable: true })
  providerId: string;

  @Column({ name: 'is_urgent', default: false })
  isUrgent: boolean;

  @Column({ name: 'access_count', default: 0 })
  accessCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @OneToMany('ImagingFile', 'study')
  files: ImagingFile[];
}

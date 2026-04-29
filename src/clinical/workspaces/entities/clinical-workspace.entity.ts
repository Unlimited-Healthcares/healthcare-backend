import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Patient } from '../../../patients/entities/patient.entity';
import { Encounter } from '../../encounters/entities/encounter.entity';
import { User } from '../../../users/entities/user.entity';
import { ClinicalLog } from './clinical-log-entry.entity';

@Entity('clinical_workspaces')
export class ClinicalWorkspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  patientId: string;

  @Column({ type: 'uuid', nullable: true })
  encounterId: string;

  @Column({ type: 'uuid', nullable: true })
  chatRoomId: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fileBucketId: string;

  @Column({ type: 'uuid', nullable: true })
  dicomStudyId: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status: 'active' | 'archived' | 'closed';

  @Column({ type: 'uuid' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => Encounter)
  @JoinColumn({ name: 'encounter_id' })
  encounter: Encounter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany('ClinicalLog', 'workspace')
  logs: ClinicalLog[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'clinical_workspace_participants',
    joinColumn: { name: 'workspace_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' }
  })
  participants: User[];
}

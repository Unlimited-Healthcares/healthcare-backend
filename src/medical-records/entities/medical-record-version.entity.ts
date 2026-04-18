import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { User } from '../../users/entities/user.entity';

@Entity('medical_record_versions')
export class MedicalRecordVersion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordId: string;

  @Column({ type: 'int' })
  versionNumber: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  recordType: string;

  @Column({ type: 'jsonb' })
  previousData: Record<string, unknown>;

  @Column({ type: 'text', nullable: true })
  changesSummary: string;

  @Column()
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => MedicalRecord)
  @JoinColumn({ name: 'recordId' })
  record: MedicalRecord;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}

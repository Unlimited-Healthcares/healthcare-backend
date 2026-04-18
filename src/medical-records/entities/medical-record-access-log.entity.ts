import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { MedicalRecordShare } from './medical-record-share.entity';
import { User } from '../../users/entities/user.entity';

@Entity('medical_record_access_log')
export class MedicalRecordAccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordId: string;

  @Column({ nullable: true })
  shareId: string;

  @Column({ nullable: true })
  accessedBy: string;

  @Column({ length: 50 })
  accessType: string; // view, download, edit, print

  @Column({ type: 'jsonb', nullable: true })
  accessDetails: Record<string, unknown>; // Additional access information

  @Column({ type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ length: 255, nullable: true })
  sessionId: string;

  @CreateDateColumn()
  accessedAt: Date;

  // Relations
  @ManyToOne(() => MedicalRecord)
  @JoinColumn({ name: 'recordId' })
  record: MedicalRecord;

  @ManyToOne(() => MedicalRecordShare)
  @JoinColumn({ name: 'shareId' })
  share: MedicalRecordShare;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'accessedBy' })
  accessedByUser: User;
}

import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { MedicalRecord } from './medical-record.entity';
import { User } from '../../users/entities/user.entity';

@Entity('medical_record_files')
export class MedicalRecordFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  recordId: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ length: 255 })
  originalFileName: string;

  @Column({ length: 500 })
  filePath: string;

  @Column({ length: 100 })
  fileType: string; // pdf, jpg, png, dicom, etc.

  @Column({ type: 'bigint' })
  fileSize: number;

  @Column({ length: 100, nullable: true })
  mimeType: string;

  @Column({ type: 'boolean', default: true })
  isEncrypted: boolean;

  @Column({ length: 255, nullable: true })
  encryptionKeyId: string; // Reference to encryption key

  @Column({ length: 500, nullable: true })
  thumbnailPath: string; // For images

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>; // File-specific metadata (DICOM tags, etc.)

  @Column({ length: 50, default: 'completed' })
  uploadStatus: string; // uploading, completed, failed

  @Column({ nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MedicalRecord, record => record.files)
  @JoinColumn({ name: 'recordId' })
  record: MedicalRecord;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;
}

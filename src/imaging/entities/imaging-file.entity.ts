import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ImagingStudy } from './imaging-study.entity';

@Entity('imaging_files')
export class ImagingFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'study_id' })
  studyId: string;

  @Column({ name: 'sop_instance_uid', unique: true, nullable: true })
  sopInstanceUid: string;

  @Column({ name: 'series_instance_uid', nullable: true })
  seriesInstanceUid: string;

  @Column({ name: 'file_path' })
  filePath: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'mime_type', default: 'application/dicom' })
  mimeType: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => ImagingStudy, (study) => study.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'study_id' })
  study: ImagingStudy;
}

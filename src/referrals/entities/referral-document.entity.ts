import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Referral } from './referral.entity';
import { User } from '../../users/entities/user.entity';

export enum DocumentType {
  REPORT = 'report',
  LAB_RESULT = 'lab_result',
  IMAGING = 'imaging',
  PRESCRIPTION = 'prescription',
  CLINICAL_NOTE = 'clinical_note',
  CONSENT_FORM = 'consent_form',
  OTHER = 'other',
}

@Entity('referral_documents')
export class ReferralDocument {
  @ApiProperty({ description: 'Unique identifier for the document' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Referral ID this document belongs to' })
  @Column()
  referralId: string;

  @ApiProperty({ description: 'Name of the document' })
  @Column()
  name: string;

  @ApiProperty({ description: 'Type of document', enum: DocumentType })
  @Column({ type: 'enum', enum: DocumentType, default: DocumentType.OTHER })
  documentType: DocumentType;

  @ApiProperty({ description: 'Description of the document' })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({ description: 'Path to the file in storage' })
  @Column()
  filePath: string;

  @ApiProperty({ description: 'Original filename' })
  @Column()
  originalFilename: string;

  @ApiProperty({ description: 'MIME type of the file' })
  @Column()
  mimeType: string;

  @ApiProperty({ description: 'Size of the file in bytes' })
  @Column()
  fileSize: number;

  @ApiProperty({ description: 'User who uploaded the document' })
  @Column()
  uploadedById: string;

  @ApiProperty({ description: 'Timestamp of when the document was created' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Timestamp of when the document was last updated' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Referral, referral => referral.documents)
  @JoinColumn({ name: 'referralId' })
  referral: Referral;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;
} 
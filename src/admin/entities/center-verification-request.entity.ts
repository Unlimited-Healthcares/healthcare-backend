import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { JsonObject } from '../../types/common';

export enum VerificationRequestType {
  INITIAL_VERIFICATION = 'initial_verification',
  RE_VERIFICATION = 're_verification',
  COMPLIANCE_REVIEW = 'compliance_review',
}

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REQUIRES_CHANGES = 'requires_changes',
}

@Entity('center_verification_requests')
export class CenterVerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'center_id' })
  centerId: string;

  @Column({ 
    type: 'enum', 
    enum: VerificationRequestType,
    name: 'request_type',
    default: VerificationRequestType.INITIAL_VERIFICATION 
  })
  requestType: VerificationRequestType;

  @Column({ 
    type: 'enum', 
    enum: VerificationStatus,
    default: VerificationStatus.PENDING 
  })
  status: VerificationStatus;

  @Column({ name: 'requested_by' })
  requestedBy: string;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;

  @Column({ name: 'submitted_at' })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', nullable: true })
  reviewedAt: Date;

  @Column({ type: 'jsonb', name: 'verification_documents', default: [] })
  verificationDocuments: JsonObject[];

  @Column({ type: 'jsonb', name: 'compliance_checklist', default: {} })
  complianceChecklist: JsonObject;

  @Column({ name: 'reviewer_notes', nullable: true })
  reviewerNotes: string;

  @Column({ name: 'rejection_reason', nullable: true })
  rejectionReason: string;

  @Column({ name: 'compliance_score', nullable: true })
  complianceScore: number;

  @Column({ name: 'next_review_date', nullable: true })
  nextReviewDate: Date;

  @Column({ type: 'jsonb', name: 'documents_metadata', nullable: true })
  documentsMetadata: JsonObject | null;

  @Column({ type: 'jsonb', name: 'verification_checklist', nullable: true })
  verificationChecklist: JsonObject | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: JsonObject;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

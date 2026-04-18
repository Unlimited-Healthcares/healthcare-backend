import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('user_requests')
export class UserRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sender_id' })
  senderId: string;

  @Column({ name: 'recipient_id', nullable: true })
  recipientId: string;

  @Column({ name: 'request_type' })
  requestType: 'connection' | 'job_application' | 'collaboration' | 'patient_request' | 'staff_invitation' | 'referral' | 'consultation_request' | 'care_task' | 'transfer_patient' | 'service_quote' | 'appointment_proposal' | 'treatment_proposal' | 'call_request' | 'medical_report_proposal' | 'prescription_proposal' | 'service_interest' | 'appointment_invitation' | 'lab_order' | 'pharmacy_transfer' | 'radiology_order';

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'scheduled' | 'declined' | 'completed';

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ name: 'payment_status', default: 'not_required' })
  paymentStatus: 'not_required' | 'pending' | 'paid' | 'verified' | 'failed';

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Column({ name: 'payment_method_used', nullable: true })
  paymentMethodUsed: string;

  @Column({ name: 'payment_proof_url', nullable: true })
  paymentProofUrl: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'responded_at', nullable: true })
  respondedAt: Date;

  @Column({ name: 'response_message', nullable: true })
  responseMessage: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;
}

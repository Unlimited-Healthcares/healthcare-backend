import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column({ name: 'invitation_type' })
  invitationType: 'staff_invitation' | 'doctor_invitation' | 'patient_invitation' | 'collaboration_invitation';

  @Column({ nullable: true })
  role?: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ unique: true })
  token: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'declined' | 'expired';

  @Column({ name: 'center_id', nullable: true })
  centerId: string;

  @Column({ name: 'sender_id', nullable: true })
  senderId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', nullable: true })
  acceptedAt: Date;

  @Column({ name: 'declined_at', nullable: true })
  declinedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}


import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('emergency_contacts')
export class EmergencyContact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'contact_name' })
  contactName: string;

  @Column({ name: 'contact_phone' })
  contactPhone: string;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column()
  relationship: string;

  @Column({ name: 'is_primary', default: false })
  isPrimary: boolean;

  @Column({ name: 'is_medical_contact', default: false })
  isMedicalContact: boolean;

  @Column({ name: 'contact_address', nullable: true })
  contactAddress: string;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'notification_preferences', type: 'jsonb', nullable: true })
  notificationPreferences: {
    sms: boolean;
    email: boolean;
    voice_call: boolean;
  };

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

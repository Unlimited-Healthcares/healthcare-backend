
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('appointment_reminders')
export class AppointmentReminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ name: 'reminder_type', length: 50 })
  reminderType: string; // confirmation, reminder_24h, reminder_1h, follow_up

  @Column({ name: 'delivery_method', length: 50 })
  deliveryMethod: string; // email, sms, push, in_app

  @Column({ name: 'scheduled_for' })
  scheduledFor: Date;

  @Column({ name: 'sent_at', nullable: true })
  sentAt: Date;

  @Column({ name: 'delivery_status', default: 'pending' })
  deliveryStatus: string; // pending, sent, delivered, failed

  @Column({ name: 'message_content', type: 'text', nullable: true })
  messageContent: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;
}

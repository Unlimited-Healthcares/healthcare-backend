
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Appointment } from './appointment.entity';
import { User } from '../../users/entities/user.entity';

@Entity('appointment_participants')
export class AppointmentParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'appointment_id' })
  appointmentId: string;

  @Column({ name: 'participant_id' })
  participantId: string;

  @Column({ name: 'participant_type', length: 50 })
  participantType: string; // patient, provider, assistant, interpreter

  @Column({ name: 'is_required', default: true })
  isRequired: boolean;

  @Column({ name: 'attendance_status', default: 'expected' })
  attendanceStatus: string; // expected, confirmed, attended, no_show

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'appointment_id' })
  appointment: Appointment;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'participant_id' })
  participant: User;
}

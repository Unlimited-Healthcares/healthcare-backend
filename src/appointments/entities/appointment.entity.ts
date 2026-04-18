import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { User } from '../../users/entities/user.entity';
import { AppointmentType } from './appointment-type.entity';
import { AppointmentParticipant } from './appointment-participant.entity';
import { AppointmentReminder } from './appointment-reminder.entity';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id', nullable: true })
  patientId: string;

  @Column({ name: 'center_id' })
  centerId: string;

  @Column({ name: 'provider_id', nullable: true })
  providerId: string;

  @Column({ name: 'appointment_type_id', nullable: true })
  appointmentTypeId: string;

  @Column({ name: 'appointment_date' })
  appointmentDate: Date;

  @Column({ name: 'duration_minutes', default: 30 })
  durationMinutes: number;

  @Column({ name: 'appointment_status', default: 'scheduled' })
  appointmentStatus: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ length: 20, default: 'normal' })
  priority: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ length: 100 })
  doctor: string;

  @Column({ name: 'is_recurring', default: false })
  isRecurring: boolean;

  @Column({ name: 'recurrence_pattern', type: 'jsonb', nullable: true })
  recurrencePattern: {
    frequency?: string;
    interval?: number;
    count?: number;
    endDate?: string;
    daysOfWeek?: string[];
    dayOfMonth?: number;
    occurrences?: number;
  };

  @Column({ name: 'parent_appointment_id', nullable: true })
  parentAppointmentId: string;

  @Column({ name: 'confirmation_status', default: 'pending' })
  confirmationStatus: string;

  @Column({ name: 'confirmed_at', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'reminder_sent_at', nullable: true })
  reminderSentAt: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string;

  @Column({ name: 'cancelled_by', nullable: true })
  cancelledBy: string;

  @Column({ name: 'cancelled_at', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'rescheduled_from', nullable: true })
  rescheduledFrom: string;

  @Column({ name: 'triage_result_id', nullable: true })
  triageResultId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @ManyToOne(() => AppointmentType)
  @JoinColumn({ name: 'appointment_type_id' })
  appointmentType: AppointmentType;

  @ManyToOne(() => Appointment)
  @JoinColumn({ name: 'parent_appointment_id' })
  parentAppointment: Appointment;

  @OneToMany(() => AppointmentParticipant, participant => participant.appointment)
  participants: AppointmentParticipant[];

  @OneToMany(() => AppointmentReminder, reminder => reminder.appointment)
  reminders: AppointmentReminder[];
}

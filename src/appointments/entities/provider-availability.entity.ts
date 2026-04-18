import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';

@Entity('provider_availability')
export class ProviderAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'provider_id' })
  providerId: string;

  @Column({ name: 'center_id' })
  centerId: string;

  @Column({ name: 'day_of_week', type: 'integer' })
  dayOfWeek: number; // 0=Sunday, 6=Saturday

  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime: string;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @Column({ name: 'break_start_time', type: 'time', nullable: true })
  breakStartTime: string;

  @Column({ name: 'break_end_time', type: 'time', nullable: true })
  breakEndTime: string;

  @Column({ name: 'max_appointments_per_slot', default: 1 })
  maxAppointmentsPerSlot: number;

  @Column({ name: 'slot_duration_minutes', default: 30 })
  slotDurationMinutes: number;

  @Column({ name: 'buffer_time_minutes', default: 0 })
  bufferTimeMinutes: number;

  @Column({ name: 'effective_from', type: 'date', nullable: true })
  effectiveFrom: Date;

  @Column({ name: 'effective_until', type: 'date', nullable: true })
  effectiveUntil: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'provider_id' })
  provider: User;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { Appointment } from './appointment.entity';

@Entity('appointment_types')
export class AppointmentType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'center_id' })
  centerId: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'duration_minutes', default: 30 })
  durationMinutes: number;

  @Column({ name: 'color_code', length: 7, default: '#3B82F6' })
  colorCode: string;

  @Column({ name: 'requires_preparation', default: false })
  requiresPreparation: boolean;

  @Column({ name: 'preparation_instructions', type: 'text', nullable: true })
  preparationInstructions: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;

  @OneToMany(() => Appointment, appointment => appointment.appointmentType)
  appointments: Appointment[];
}

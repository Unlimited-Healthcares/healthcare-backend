
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BloodDonor } from './blood-donor.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { User } from '../../users/entities/user.entity';

@Entity('donation_appointments')
export class DonationAppointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'donor_id' })
  donorId: string;

  @Column({ name: 'center_id' })
  centerId: string;

  @Column({ name: 'appointment_date' })
  appointmentDate: Date;

  @Column({ name: 'duration_minutes', default: 60 })
  durationMinutes: number;

  @Column({ default: 'scheduled' })
  status: string;

  @Column({ name: 'pre_screening_completed', default: false })
  preScreeningCompleted: boolean;

  @Column({ name: 'staff_assigned', nullable: true })
  staffAssigned: string;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => BloodDonor, donor => donor.appointments)
  @JoinColumn({ name: 'donor_id' })
  donor: BloodDonor;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'staff_assigned' })
  staff: User;
}

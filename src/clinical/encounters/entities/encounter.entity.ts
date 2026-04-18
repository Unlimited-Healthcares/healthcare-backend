import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../../patients/entities/patient.entity';
import { HealthcareCenter } from '../../../centers/entities/center.entity';
import { User } from '../../../users/entities/user.entity';
import { Appointment } from '../../../appointments/entities/appointment.entity';

@Entity('encounters')
export class Encounter {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id' })
    patientId: string;

    @Column({ name: 'provider_id' })
    providerId: string;

    @Column({ name: 'center_id', nullable: true })
    centerId: string;

    @Column({ name: 'appointment_id', nullable: true })
    appointmentId: string;

    @Column({ name: 'start_time' })
    startTime: Date;

    @Column({ name: 'end_time', nullable: true })
    endTime: Date;

    @Column({ length: 50, default: 'consultation' })
    type: string; // consultation, emergency, follow-up, home-visit

    @Column({ length: 50, default: 'in-progress' })
    status: string; // in-progress, completed, cancelled

    @Column({ type: 'text', nullable: true })
    chiefComplaint: string;

    @Column({ type: 'jsonb', nullable: true })
    vitals: Record<string, unknown>;

    @Column({ type: 'text', nullable: true })
    clinicalNotes: string;

    @Column({ type: 'text', nullable: true })
    diagnosis: string;

    @Column({ type: 'text', nullable: true })
    treatmentPlan: string;

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

    @ManyToOne(() => User)
    @JoinColumn({ name: 'provider_id' })
    provider: User;

    @ManyToOne(() => HealthcareCenter)
    @JoinColumn({ name: 'center_id' })
    center: HealthcareCenter;

    @ManyToOne(() => Appointment)
    @JoinColumn({ name: 'appointment_id' })
    appointment: Appointment;
}

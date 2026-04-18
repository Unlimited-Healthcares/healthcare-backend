import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Prescription } from '../../prescriptions/entities/prescription.entity';
import { Patient } from '../../../patients/entities/patient.entity';

@Entity('medication_adherence')
export class MedicationAdherence {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id' })
    patientId: string;

    @Column({ name: 'prescription_id' })
    prescriptionId: string;

    @Column({ name: 'medication_name' })
    medicationName: string;

    @Column({ name: 'scheduled_time' })
    scheduledTime: Date;

    @Column({ name: 'taken_at', nullable: true })
    takenAt: Date;

    @Column({ length: 50, default: 'pending' })
    status: string; // pending, taken, missed, skipped

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;

    @ManyToOne(() => Prescription)
    @JoinColumn({ name: 'prescription_id' })
    prescription: Prescription;
}

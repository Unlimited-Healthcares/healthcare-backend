import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Patient } from '../../../patients/entities/patient.entity';
import { User } from '../../../users/entities/user.entity';
import { Encounter } from '../../encounters/entities/encounter.entity';

@Entity('discharge_plans')
export class DischargePlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id' })
    patientId: string;

    @Column({ name: 'doctor_id' })
    doctorId: string;

    @Column({ name: 'encounter_id' })
    encounterId: string;

    @Column({ type: 'text' })
    diagnosis: string;

    @Column({ type: 'jsonb' })
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        instructions?: string;
    }>;

    @Column({ type: 'text', nullable: true })
    followUpAppointments: string;

    @Column({ type: 'jsonb', nullable: true })
    redFlags: string[];

    @Column({ length: 50, default: 'draft' })
    status: string; // draft, active, completed

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'doctor_id' })
    doctor: User;

    @ManyToOne(() => Encounter)
    @JoinColumn({ name: 'encounter_id' })
    encounter: Encounter;
}

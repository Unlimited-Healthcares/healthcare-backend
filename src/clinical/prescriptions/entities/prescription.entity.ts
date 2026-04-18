import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../../patients/entities/patient.entity';
import { User } from '../../../users/entities/user.entity';
import { Encounter } from '../../encounters/entities/encounter.entity';

@Entity('prescriptions')
export class Prescription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id' })
    patientId: string;

    @Column({ name: 'provider_id' })
    providerId: string;

    @Column({ name: 'encounter_id', nullable: true })
    encounterId: string;

    @Column({ name: 'prescription_number', unique: true })
    prescriptionNumber: string;

    @Column({ type: 'jsonb' })
    medications: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
    }>;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ length: 50, default: 'active' })
    status: string; // active, completed, cancelled, expired

    @Column({ name: 'expires_at', nullable: true })
    expiresAt: Date;

    @Column({ type: 'boolean', default: false })
    isDigitalSignatureVerified: boolean;

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

    @ManyToOne(() => Encounter)
    @JoinColumn({ name: 'encounter_id' })
    encounter: Encounter;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../../patients/entities/patient.entity';

@Entity('consent_forms')
export class ConsentForm {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id' })
    patientId: string;

    @Column({ length: 255 })
    title: string;

    @Column({ type: 'text' })
    content: string;

    @Column({ length: 50 })
    version: string;

    @Column({ name: 'signed_at', nullable: true })
    signedAt: Date;

    @Column({ name: 'ip_address', nullable: true })
    ipAddress: string;

    @Column({ length: 50, default: 'pending' })
    status: string; // pending, signed, withdrawn

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;
}

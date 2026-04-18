import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MedicalRecord } from '../../medical-records/entities/medical-record.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';

@Entity('medical_reports')
export class MedicalReport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'report_number', unique: true })
    reportNumber: string; // e.g., REP-2026-0001

    @Column()
    recordId: string;

    @Column()
    patientId: string;

    @Column()
    centerId: string;

    @Column()
    generatedBy: string;

    @Column({ name: 'pdf_url', nullable: true })
    pdfUrl: string;

    @Column({ name: 'verification_code', unique: true })
    verificationCode: string;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any>;

    @Column({ default: 'active' })
    status: string;

    @Column({ type: 'jsonb', nullable: true })
    sharedWith: string[]; // Array of user/center IDs granted access

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => MedicalRecord)
    @JoinColumn({ name: 'recordId' })
    record: MedicalRecord;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patientId' })
    patient: Patient;

    @ManyToOne(() => HealthcareCenter)
    @JoinColumn({ name: 'centerId' })
    center: HealthcareCenter;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'generatedBy' })
    creator: User;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../../patients/entities/patient.entity';
import { User } from '../../../users/entities/user.entity';

@Entity('rehab_plans')
export class RehabPlan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'patient_id' })
    patientId: string;

    @Column({ name: 'physio_id' })
    physioId: string;

    @Column()
    title: string;

    @Column({ type: 'jsonb' })
    exercises: Array<{
        name: string;
        sets: string;
        reps: string;
        videoUrl?: string;
        instructions?: string;
    }>;

    @Column({ type: 'jsonb', nullable: true })
    completionLogs: Array<{
        exerciseName: string;
        date: string;
        completed: boolean;
        notes?: string;
    }>;

    @Column({ length: 50, default: 'active' })
    status: string; // active, completed, cancelled

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Patient)
    @JoinColumn({ name: 'patient_id' })
    patient: Patient;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'physio_id' })
    physio: User;
}

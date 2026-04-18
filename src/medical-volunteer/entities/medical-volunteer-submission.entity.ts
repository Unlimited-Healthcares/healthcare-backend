import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('medical_volunteer_submissions')
export class MedicalVolunteerSubmission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    professionalRole: string; // 'doctor', 'nurse', 'paramedic', etc.

    @Column()
    specialization: string;

    @Column()
    practiceNumber: string;

    @Column()
    country: string;

    @Column()
    professionalBody: string;

    // Document file paths
    @Column()
    licenseFilePath: string;

    @Column({ nullable: true })
    additionalDocFilePath: string;

    @Column({ nullable: true })
    verificationLink: string;

    @Column({ type: 'date', nullable: true })
    issueDate: Date;

    @Column({ type: 'date', nullable: true })
    expiryDate: Date;

    // Review fields
    @Column({
        type: 'enum',
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
    })
    status: 'PENDING' | 'APPROVED' | 'REJECTED';

    @Column({ nullable: true })
    reviewedBy: string;

    @Column({ nullable: true })
    reviewedAt: Date;

    @Column({ nullable: true })
    reviewNotes: string;

    @CreateDateColumn()
    submittedAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

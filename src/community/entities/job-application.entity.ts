import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { CommunityJob } from './job.entity';

@Entity('job_applications')
export class JobApplication {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => CommunityJob)
    @JoinColumn({ name: 'job_id' })
    job: CommunityJob;

    @Column({ name: 'job_id' })
    jobId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'applicant_id' })
    applicant: User;

    @Column({ name: 'applicant_id' })
    applicantId: string;

    @Column({ default: 'PENDING' })
    status: string; // PENDING, REVIEWED, REJECTED, ACCEPTED

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}

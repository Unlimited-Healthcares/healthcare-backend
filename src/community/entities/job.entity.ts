import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('community_jobs')
export class CommunityJob {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column()
    company: string;

    @Column({ nullable: true })
    companyLogo: string;

    @Column()
    location: string;

    @Column('text')
    description: string;

    @Column({ nullable: true })
    salary: string;

    @Column({ nullable: true })
    externalUrl: string;

    @Column({ default: 'Full-time' })
    type: string; // Full-time, Part-time, Contract

    @Column({ default: 'OPEN' })
    status: string; // OPEN, CLOSED

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'posted_by_id' })
    postedBy: User;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

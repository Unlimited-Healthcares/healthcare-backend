import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('kyc_submissions')
export class KycSubmission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    // Personal information
    @Column()
    fullName: string;

    @Column()
    idDocType: string; // 'national_id' | 'passport' | 'drivers_license' | 'voters_card'

    @Column()
    idDocNumber: string;

    // Address information
    @Column()
    address: string;

    @Column()
    city: string;

    @Column()
    state: string;

    @Column({ nullable: true })
    zipCode: string;

    // Document file paths (stored on disk or cloud storage)
    @Column()
    idDocFilePath: string;

    @Column({ nullable: true })
    selfieFilePath: string;

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

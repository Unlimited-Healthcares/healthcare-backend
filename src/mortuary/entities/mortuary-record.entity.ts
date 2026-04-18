import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { HealthcareCenter as Center } from '../../centers/entities/center.entity';

export enum MortuaryStatus {
    STORED = 'Stored',
    PENDING_RELEASE = 'Pending Release',
    PENDING_AUTOPSY = 'Pending Autopsy',
    RELEASED = 'Released',
}

@Entity('mortuary_records')
export class MortuaryRecord {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    deceasedName: string;

    @Column({ type: 'timestamp' })
    intakeDate: Date;

    @Column({ nullable: true })
    unit: string;

    @Column({
        type: 'enum',
        enum: MortuaryStatus,
        default: MortuaryStatus.STORED,
    })
    status: MortuaryStatus;

    @Column({ nullable: true })
    representativeName: string;

    @Column({ nullable: true })
    representativePhone: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ nullable: true })
    signedManifestUrl: string;

    @ManyToOne(() => Center, { nullable: false })
    center: Center;

    @Column()
    centerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

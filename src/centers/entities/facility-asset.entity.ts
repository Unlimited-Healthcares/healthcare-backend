
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HealthcareCenter } from './center.entity';
import { User } from '../../users/entities/user.entity';

@Entity('facility_assets')
export class FacilityAsset {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'center_id', type: 'uuid', nullable: true })
    centerId: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId: string;

    @Column()
    assetType: 'service' | 'equipment';

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    category: string;

    @Column({ type: 'text', nullable: true })
    uses: string; // Specific for equipment

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    basePrice: number;

    @Column({ nullable: true })
    durationMinutes: number;

    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => HealthcareCenter, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'centerId' })
    center: HealthcareCenter;

    @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

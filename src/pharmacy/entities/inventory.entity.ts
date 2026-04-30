import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { HealthcareCenter } from '../../centers/entities/center.entity';

@Entity('pharmacy_inventory')
export class PharmacyInventory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    sku: string;

    @Column('int')
    stockLevel: number;

    @Column('int')
    minThreshold: number;

    @Column({ default: 'ok' })
    status: 'ok' | 'low' | 'out_of_stock';

    @Column({ nullable: true })
    batchNumber: string;

    @Column({ type: 'timestamp', nullable: true })
    expiryDate: Date;

    @Column({ nullable: true })
    category: string;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    unitPrice: number;

    @Column({ nullable: true })
    centerId: string;

    @ManyToOne(() => HealthcareCenter)
    center: HealthcareCenter;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

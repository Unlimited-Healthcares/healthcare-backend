import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Center } from '../../centers/entities/center.entity';

export enum EquipmentStatus {
    ONLINE = 'online',
    OFFLINE = 'offline',
    FAULTY = 'faulty',
    MAINTENANCE = 'maintenance'
}

@Entity('equipment')
export class Equipment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    uniqueId: string; // Serial number or asset tag

    @Column()
    name: string; // e.g., Ventilator V500, Infusion Pump

    @Column()
    type: string; // e.g., Life-Support, Monitoring

    @Column({
        type: 'enum',
        enum: EquipmentStatus,
        default: EquipmentStatus.ONLINE
    })
    status: EquipmentStatus;

    @Column({ nullable: true })
    location: string; // Ward or Room number

    @Column({ type: 'jsonb', nullable: true })
    metadata: any; // Device logs, battery status, calibration data

    @Column({ nullable: true })
    lastCalibrationDate: Date;

    @Column({ nullable: true })
    nextCalibrationDate: Date;

    @ManyToOne(() => Center)
    center: Center;

    @Column()
    centerId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { BloodType } from '../enums/blood-type.enum';

@Entity('blood_inventory')
export class BloodInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'center_id' })
  centerId: string;

  @Column({ type: 'enum', enum: BloodType, name: 'blood_type' })
  bloodType: BloodType;

  @Column({ name: 'total_units', default: 0 })
  totalUnits: number;

  @Column({ name: 'available_units', default: 0 })
  availableUnits: number;

  @Column({ name: 'reserved_units', default: 0 })
  reservedUnits: number;

  @Column({ name: 'expired_units', default: 0 })
  expiredUnits: number;

  @Column({ name: 'minimum_threshold', default: 5 })
  minimumThreshold: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;
}


import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HealthcareCenter } from './center.entity';

@Entity('center_availability')
export class CenterAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'center_id', type: 'uuid' })
  centerId: string;

  @Column()
  dayOfWeek: number; // 0=Sunday, 6=Saturday

  @Column('time')
  openTime: string;

  @Column('time')
  closeTime: string;

  @Column({ default: false })
  isEmergencyHours: boolean;

  @Column('time', { nullable: true })
  breakStartTime: string;

  @Column('time', { nullable: true })
  breakEndTime: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => HealthcareCenter)
  @JoinColumn({ name: 'centerId' })
  center: HealthcareCenter;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

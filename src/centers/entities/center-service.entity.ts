
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HealthcareCenter } from './center.entity';

@Entity('center_services')
export class CenterService {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'center_id', type: 'uuid' })
  centerId: string;

  @Column({ name: 'name' })
  serviceName: string;

  @Column({ name: 'category', nullable: true })
  serviceCategory: string; // consultation, diagnostic, treatment, emergency, etc.

  @Column('text', { nullable: true })
  description: string;

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes: number;

  @Column('decimal', { name: 'price', precision: 10, scale: 2, nullable: true })
  basePrice: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column({ default: false })
  isEmergencyService: boolean;

  @Column({ default: true })
  requiresAppointment: boolean;

  @Column({ name: 'is_available', default: true })
  isActive: boolean;

  @ManyToOne(() => HealthcareCenter, center => center.services)
  @JoinColumn({ name: 'centerId' })
  center: HealthcareCenter;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

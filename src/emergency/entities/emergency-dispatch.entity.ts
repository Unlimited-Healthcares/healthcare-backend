import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('emergency_dispatches')
export class EmergencyDispatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'emergency_type' })
  emergencyType: string;

  @Column()
  priority: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'contact_number' })
  contactNumber: string;

  @Column({ name: 'dispatched_by' })
  dispatchedBy: string;

  @Column()
  status: string;

  @Column({ name: 'dispatch_time' })
  dispatchTime: Date;

  @Column({ name: 'completed_at', nullable: true })
  completedAt?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
} 
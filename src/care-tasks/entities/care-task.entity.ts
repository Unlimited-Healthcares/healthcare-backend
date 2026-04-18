import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

@Entity('care_tasks')
export class CareTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @Column({ name: 'assigned_to_id', nullable: true })
  assignedToId: string;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ name: 'due_at', nullable: true })
  dueAt: Date;

  @Column({ default: 'medium' })
  priority: 'low' | 'medium' | 'high' | 'urgent';

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;
}

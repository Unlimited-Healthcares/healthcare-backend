
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HealthcareCenter } from './center.entity';
import { User } from '../../users/entities/user.entity';

@Entity('center_staff')
export class CenterStaff {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'center_id', type: 'uuid' })
  centerId: string;

  @Column({ default: 'staff' })
  role: string;

  @ManyToOne(() => HealthcareCenter, center => center.staff)
  @JoinColumn({ name: 'center_id' })
  center: HealthcareCenter;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}

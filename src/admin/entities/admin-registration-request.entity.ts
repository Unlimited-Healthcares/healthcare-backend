import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AdminRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

@Entity('admin_registration_requests')
export class AdminRegistrationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column('simple-array')
  requestedRoles: string[];

  @Column({ nullable: true })
  phone?: string;

  @Column('text')
  reason: string;

  @Column()
  intendedRole: string;

  @Column({
    type: 'enum',
    enum: AdminRequestStatus,
    default: AdminRequestStatus.PENDING
  })
  status: AdminRequestStatus;

  @Column({ nullable: true })
  decisionReason?: string;

  @Column('simple-array', { nullable: true })
  finalRoles?: string[];

  @Column({ nullable: true })
  reviewedBy?: string;

  @Column({ nullable: true })
  reviewedAt?: Date;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer?: User;
}

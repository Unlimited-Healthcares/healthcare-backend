import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum SupportTicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum SupportTicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  subject: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: SupportTicketStatus,
    default: SupportTicketStatus.OPEN
  })
  status: SupportTicketStatus;

  @Column({
    type: 'enum',
    enum: SupportTicketPriority,
    default: SupportTicketPriority.MEDIUM
  })
  priority: SupportTicketPriority;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum SupportChatSessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('support_chat_sessions')
export class SupportChatSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'jsonb', default: [] })
  messages: Array<{ role: 'user' | 'model'; parts: string; timestamp: string }>;

  @Column({
    type: 'enum',
    enum: SupportChatSessionStatus,
    default: SupportChatSessionStatus.ACTIVE,
  })
  status: SupportChatSessionStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

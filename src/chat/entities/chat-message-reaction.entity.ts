
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_message_reactions')
@Unique(['messageId', 'userId', 'reaction'])
export class ChatMessageReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  messageId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  reaction: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ChatMessage, message => message.reactions)
  @JoinColumn({ name: 'messageId' })
  message: ChatMessage;
}

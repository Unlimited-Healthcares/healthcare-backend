import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { ChatMessageReaction } from './chat-message-reaction.entity';
import { JsonObject } from 'type-fest';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'uuid' })
  senderId: string;

  @Column({ type: 'varchar', length: 50, default: 'text' })
  messageType: 'text' | 'file' | 'image' | 'video' | 'audio' | 'system' | 'video_call_start' | 'video_call_end';

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fileType: string;

  @Column({ type: 'uuid', nullable: true })
  replyToMessageId: string;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  editedAt: Date;

  @Column({ type: 'boolean', default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @Column({ type: 'varchar', length: 20, default: 'sent' })
  deliveryStatus: 'sent' | 'delivered' | 'read';

  @ApiProperty({ description: 'Message metadata' })
  @Column('jsonb', { default: {} })
  metadata: JsonObject;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ChatRoom, room => room.messages)
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @OneToMany(() => ChatMessageReaction, reaction => reaction.message)
  reactions: ChatMessageReaction[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;
}

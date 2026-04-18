import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { ChatParticipant } from './chat-participant.entity';
import { ChatMessage } from './chat-message.entity';
import { JsonObject } from 'type-fest';
import { ApiProperty } from '@nestjs/swagger';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  type: 'direct' | 'group' | 'consultation' | 'emergency' | 'support' | 'referral';

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string;

  @Column({ type: 'uuid', nullable: true })
  centerId: string;

  @Column({ type: 'uuid', nullable: true })
  referralId: string;

  @Column({ type: 'uuid' })
  createdBy: string;

  @Column({ type: 'integer', default: 10 })
  maxParticipants: number;

  @Column({ type: 'boolean', default: true })
  isEncrypted: boolean;

  @Column({ type: 'integer', default: 90 })
  autoDeleteAfterDays: number;

  @ApiProperty({ description: 'Room settings' })
  @Column('jsonb', { default: {} })
  roomSettings: JsonObject;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ChatParticipant, participant => participant.room)
  participants: ChatParticipant[];

  @OneToMany(() => ChatMessage, message => message.room)
  messages: ChatMessage[];
}

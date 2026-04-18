import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { ChatRoom } from './chat-room.entity';
import { JsonObject } from 'type-fest';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/entities/user.entity';

interface ChatPermissions {
  can_send_messages: boolean;
  can_send_files: boolean;
  can_start_video: boolean;
  can_moderate?: boolean;
  can_invite_users?: boolean;
}

@Entity('chat_participants')
@Unique(['roomId', 'userId'])
export class ChatParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  roomId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50, default: 'participant' })
  role: 'admin' | 'moderator' | 'participant' | 'observer';

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leftAt: Date;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', default: { can_send_messages: true, can_send_files: true, can_start_video: true } })
  permissions: ChatPermissions;

  @ApiProperty({ description: 'Participant settings' })
  @Column('jsonb', { default: {} })
  participantSettings: JsonObject;

  @ManyToOne(() => ChatRoom, room => room.participants)
  @JoinColumn({ name: 'roomId' })
  room: ChatRoom;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}

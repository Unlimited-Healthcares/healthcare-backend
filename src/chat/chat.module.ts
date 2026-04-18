
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './services/chat.service';
import { ChatController } from './controllers/chat.controller';
import { ChatGateway } from './websocket.gateway';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatParticipant } from './entities/chat-participant.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { ChatMessageReaction } from './entities/chat-message-reaction.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ChatRoom,
      ChatParticipant,
      ChatMessage,
      ChatMessageReaction,
    ]),
    AuditModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService, ChatGateway],
})
export class ChatModule { }

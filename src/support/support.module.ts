import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportAiService } from './support-ai.service';
import { SupportTicket } from './entities/support-ticket.entity';
import { SupportChatSession } from './entities/support-chat-session.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, SupportChatSession]),
    EmailModule
  ],
  controllers: [SupportController],
  providers: [SupportService, SupportAiService],
  exports: [SupportService, SupportAiService],
})
export class SupportModule { }

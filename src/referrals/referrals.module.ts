import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { Referral } from './entities/referral.entity';
import { ReferralDocument } from './entities/referral-document.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuditModule } from '../audit/audit.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Referral,
      ReferralDocument,
    ]),
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
    SupabaseModule,
    AuditModule,
    ChatModule,
    NotificationsModule,
  ],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule { }
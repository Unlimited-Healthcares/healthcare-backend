
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailNotificationService } from './email-notification.service';
import { RealtimeNotificationService } from './realtime-notification.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationGateway } from './websocket.gateway';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationTemplate } from './entities/notification-template.entity';
import { User } from '../users/entities/user.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      NotificationTemplate,
      User,
    ]),
    AuditModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailNotificationService,
    RealtimeNotificationService,
    PushNotificationService,
    NotificationGateway,
  ],
  exports: [
    NotificationsService,
    EmailNotificationService,
    RealtimeNotificationService,
    PushNotificationService,
  ],
})
export class NotificationsModule {}

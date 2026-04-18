import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Notification } from './entities/notification.entity';
import { NotificationGateway } from './websocket.gateway';

interface CenterMessage {
  type: string;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, unknown>;
}

interface UrgentAlert {
  type: string;
  title: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  actionRequired?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class RealtimeNotificationService {
  private readonly logger = new Logger(RealtimeNotificationService.name);

  constructor(
    @Inject(forwardRef(() => NotificationGateway))
    private gateway: NotificationGateway
  ) {}

  async sendRealtimeNotification(notification: Notification): Promise<void> {
    try {
      if (!notification.userId) return;

      const message = {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        notificationType: notification.type,
        isUrgent: notification.isUrgent,
        data: notification.data,
        createdAt: notification.createdAt,
      };

      await this.gateway.sendToUser(notification.userId, message as any);

      this.logger.log(`Real-time notification sent to user ${notification.userId} via Gateway`);
    } catch (error) {
      this.logger.error(`Failed to send real-time notification: ${error.message}`, error.stack);
    }
  }

  // Legacy method for raw WS compatibility (ignored if using Gateway)
  addConnection(_userId: string, _ws: any): void {}
  removeConnection(_userId: string, _ws: any): void {}

  async broadcastToCenter(centerId: string, message: CenterMessage): Promise<void> {
    await this.gateway.sendToCenter(centerId, message as any);
  }

  async sendUrgentAlert(userId: string, alert: UrgentAlert): Promise<void> {
    await this.gateway.sendUrgentAlert(userId, alert as any);
  }
}

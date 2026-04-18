import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { EmailNotificationService } from './email-notification.service';
import { RealtimeNotificationService } from './realtime-notification.service';
import { PushNotificationService } from './push-notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { AuditLogService } from '../audit/audit-log.service';

export interface NotificationFilters {
  type?: string;
  isRead?: boolean;
  page: number;
  limit: number;
}

export interface NotificationKPIs {
  totalNotifications: number;
  totalNotificationsChange: number;
  unreadNotifications: number;
  unreadNotificationsChange: number;
  criticalNotifications: number;
  criticalNotificationsChange: number;
  todayNotifications: number;
  todayNotificationsChange: number;
  deliveryRate: number;
  deliveryRateChange: number;
  averageResponseTime: number;
  averageResponseTimeChange: number;
  typeCounts: Record<string, number>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    private emailService: EmailNotificationService,
    private realtimeService: RealtimeNotificationService,
    private pushService: PushNotificationService,
    private auditService: AuditLogService,
  ) { }

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);

    // Send notification based on delivery method and user preferences
    await this.sendNotification(savedNotification);

    await this.auditService.log({
      action: 'notification_created',
      entityType: 'notification',
      entityId: savedNotification.id,
      userId: savedNotification.userId,
      details: { type: savedNotification.type, title: savedNotification.title }
    });

    return savedNotification;
  }

  async getUserNotifications(userId: string, filters: NotificationFilters): Promise<{ notifications: Notification[], total: number }> {
    const query = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (filters.type) {
      query.andWhere('notification.type = :type', { type: filters.type });
    }

    if (filters.isRead !== undefined) {
      query.andWhere('notification.isRead = :isRead', { isRead: filters.isRead });
    }

    const total = await query.getCount();
    const notifications = await query
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getMany();

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false }
    });
  }

  async getKPIs(userId: string): Promise<NotificationKPIs> {
    const total = await this.notificationRepository.count({ where: { userId } });
    const unread = await this.getUnreadCount(userId);
    const critical = await this.notificationRepository.count({
      where: { userId, isUrgent: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.notificationRepository.createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.createdAt >= :today', { today })
      .getCount();

    // Get counts by type
    const typeCounts = await this.notificationRepository.createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.userId = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    const typeMap = {};
    typeCounts.forEach(tc => {
      typeMap[tc.type] = parseInt(tc.count);
    });

    return {
      totalNotifications: total,
      totalNotificationsChange: 0,
      unreadNotifications: unread,
      unreadNotificationsChange: 0,
      criticalNotifications: critical,
      criticalNotificationsChange: 0,
      todayNotifications: todayCount,
      todayNotificationsChange: 0,
      deliveryRate: 100,
      deliveryRateChange: 0,
      averageResponseTime: 0,
      averageResponseTimeChange: 0,
      typeCounts: typeMap
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return await this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId });
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({ id, userId });

    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async getUserPreferences(userId: string): Promise<NotificationPreference> {
    let preferences = await this.preferenceRepository.findOne({
      where: { userId }
    });

    if (!preferences) {
      preferences = this.preferenceRepository.create({ userId });
      preferences = await this.preferenceRepository.save(preferences);
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    updateDto: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreference> {
    let preferences = await this.getUserPreferences(userId);

    Object.assign(preferences, updateDto);
    preferences = await this.preferenceRepository.save(preferences);

    await this.auditService.log({
      action: 'notification_preferences_updated',
      entityType: 'notification_preference',
      entityId: preferences.id,
      userId: userId,
      details: updateDto as Record<string, unknown>
    });

    return preferences;
  }

  async broadcast(
    createDto: CreateNotificationDto,
    target: { roles?: string[]; userIds?: string[] }
  ): Promise<void> {
    const { roles, userIds } = target;
    let recipients: string[] = [];

    if (userIds && userIds.length > 0) {
      recipients = [...userIds];
    }

    if (roles && roles.length > 0) {
      // Find users with these roles
      // Note: roles is a simple-array in User entity, so we use LIKE for each role
      const query = this.notificationRepository.manager.createQueryBuilder('User', 'user')
        .select('user.id', 'id');

      roles.forEach((role, index) => {
        if (index === 0) {
          query.where('user.roles LIKE :role' + index, { ['role' + index]: `%${role}%` });
        } else {
          query.orWhere('user.roles LIKE :role' + index, { ['role' + index]: `%${role}%` });
        }
      });

      const usersWithRoles = await query.getRawMany();
      const roleUserIds = usersWithRoles.map(u => u.id);
      recipients = [...new Set([...recipients, ...roleUserIds])];
    }

    if (recipients.length === 0) return;

    // Create notifications for all recipients
    const notifications = recipients.map(uid =>
      this.notificationRepository.create({
        ...createDto,
        userId: uid
      })
    );

    await this.notificationRepository.save(notifications);

    // Send them out (usually you'd use a background job/queue here for performance)
    for (const notification of notifications) {
      this.sendNotification(notification).catch(err =>
        this.logger.error(`Broadcast failure for user ${notification.userId}: ${err.message}`)
      );
    }
  }

  async sendTestNotification(userId: string, type: string): Promise<void> {
    const testNotification = {
      userId,
      title: `Test ${type} Notification`,
      message: `This is a test notification of type ${type}`,
      type,
      deliveryMethod: 'all',
    };

    await this.createNotification(testNotification);
  }

  private async sendNotification(notification: Notification): Promise<void> {
    if (!notification.userId) return;

    const preferences = await this.getUserPreferences(notification.userId);
    const typePreference = this.getTypePreference(preferences, notification.type);

    // Send real-time notification
    await this.realtimeService.sendRealtimeNotification(notification);

    // Send email for all actions as requested by user
    await this.emailService.sendEmailNotification(notification);

    // Send push notification if enabled
    if (typePreference === 'push' || typePreference === 'both') {
      await this.pushService.sendPushNotification(notification);
    }

    // Update delivery status
    notification.sentAt = new Date();
    notification.deliveryStatus = 'sent';
    await this.notificationRepository.save(notification);
  }

  private getTypePreference(preferences: NotificationPreference, type: string): string {
    switch (type) {
      case 'appointment':
      case 'appointment_scheduled':
      case 'request_received':
      case 'request_confirmed':
      case 'request_responded':
      case 'request_approved':
      case 'response_declined':
        return preferences.appointment;
      case 'medical_record':
      case 'medical_record_request':
        return preferences.medicalRecordRequest;
      case 'referral':
        return preferences.referral;
      case 'payment':
        return preferences.payment;
      case 'test_result':
        return preferences.testResult;
      case 'system':
      case 'staff_added':
      case 'profile_update':
      case 'security_alert':
        return preferences.system;
      case 'message':
      case 'chat_message':
        return preferences.message;
      default:
        return 'both';
    }
  }
}

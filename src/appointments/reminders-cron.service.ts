import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentsService } from './appointments.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RemindersCronService {
  private readonly logger = new Logger(RemindersCronService.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleAppointmentReminders() {
    this.logger.log('Running appointment reminders job...');
    
    try {
      const pendingReminders = await this.appointmentsService.getPendingReminders();
      
      this.logger.log(`Found ${pendingReminders.length} pending reminders`);

      for (const reminder of pendingReminders) {
        try {
          // Send notification
          await this.notificationsService.createNotification({
            userId: reminder.recipientId,
            title: `Appointment Reminder: ${reminder.reminderType}`,
            message: reminder.messageContent,
            type: 'appointment',
            deliveryMethod: reminder.deliveryMethod,
            data: {
              appointmentId: reminder.appointmentId,
              reminderId: reminder.id
            }
          });

          // Mark reminder as sent
          await this.appointmentsService.markReminderSent(reminder.id);
          
          this.logger.debug(`Sent reminder ${reminder.id} to user ${reminder.recipientId}`);
        } catch (error) {
          this.logger.error(`Failed to send reminder ${reminder.id}: ${error.message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in appointment reminders job: ${error.message}`);
    }
  }
}

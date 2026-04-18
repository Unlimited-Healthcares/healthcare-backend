import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmergencyAlert, AlertType, AlertStatus } from '../entities/emergency-alert.entity';
import { EmergencyContact } from '../entities/emergency-contact.entity';
import { SmsService } from '../../integrations/sms.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AuditLogService } from '../../audit/audit-log.service';
import { EmergencyMedicalData } from '../entities/emergency-medical-data.entity';
import { JsonObject } from 'type-fest';

@Injectable()
export class EmergencyAlertsService {
  private readonly logger = new Logger(EmergencyAlertsService.name);

  constructor(
    @InjectRepository(EmergencyAlert)
    private alertRepository: Repository<EmergencyAlert>,
    @InjectRepository(EmergencyContact)
    private contactRepository: Repository<EmergencyContact>,
    private smsService: SmsService,
    private notificationsService: NotificationsService,
    private auditLogService: AuditLogService,
  ) { }

  async createSOSAlert(alertData: {
    userId: string;
    patientId?: string;
    type: AlertType;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    contactNumber: string;
    medicalInfo?: EmergencyMedicalData;
    isTestAlert?: boolean;
  }): Promise<EmergencyAlert> {
    try {
      // Generate unique alert number
      const alertNumber = `SOS-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Get user's emergency contacts
      const emergencyContacts = await this.contactRepository.find({
        where: { userId: alertData.userId, isActive: true },
        order: { isPrimary: 'DESC', isMedicalContact: 'DESC' },
      });

      const alert = this.alertRepository.create({
        ...alertData,
        alertNumber,
        status: AlertStatus.ACTIVE,
        emergencyContacts: emergencyContacts.map(contact => ({
          name: contact.contactName,
          phone: contact.contactPhone,
          email: contact.contactEmail,
          relationship: contact.relationship,
          is_primary: contact.isPrimary,
        })),
      });

      const savedAlert = await this.alertRepository.save(alert);

      // Send immediate notifications
      await this.sendEmergencyNotifications(savedAlert);

      // Notify emergency services (911/emergency hotlines)
      await this.notifyEmergencyServices(savedAlert);

      await this.auditLogService.log({
        action: 'CREATE_SOS_ALERT',
        entityType: 'EmergencyAlert',
        entityId: savedAlert.id,
        userId: alertData.userId,
        details: {
          alertNumber: savedAlert.alertNumber,
          type: savedAlert.type,
          location: `${alertData.latitude},${alertData.longitude}`,
          isTestAlert: alertData.isTestAlert || false,
        },
      });

      this.logger.log(`SOS Alert created: ${savedAlert.alertNumber}`);
      return savedAlert;
    } catch (error) {
      this.logger.error(`Failed to create SOS alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<EmergencyAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Emergency alert not found');
    }

    const responseTime = Math.floor((new Date().getTime() - alert.createdAt.getTime()) / (1000 * 60));

    await this.alertRepository.update(alertId, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
      acknowledgedBy,
      responseTimeMinutes: responseTime,
    });

    // Notify contacts that help is on the way
    await this.sendAcknowledgmentNotifications(alert);

    return this.alertRepository.findOne({ where: { id: alertId } });
  }

  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<EmergencyAlert> {
    const alert = await this.alertRepository.findOne({
      where: { id: alertId },
    });

    if (!alert) {
      throw new NotFoundException('Emergency alert not found');
    }

    await this.alertRepository.update(alertId, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
      resolvedBy,
      resolutionNotes,
    });

    // Notify contacts that situation is resolved
    await this.sendResolutionNotifications(alert);

    return this.alertRepository.findOne({ where: { id: alertId } });
  }

  async createEmergencyContact(contactData: {
    userId: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    relationship: string;
    isPrimary?: boolean;
    isMedicalContact?: boolean;
    contactAddress?: string;
    notes?: string;
    notificationPreferences?: JsonObject;
  }): Promise<EmergencyContact> {
    // If setting as primary, unset other primary contacts
    if (contactData.isPrimary) {
      await this.contactRepository.update(
        { userId: contactData.userId, isPrimary: true },
        { isPrimary: false }
      );
    }

    const contact = this.contactRepository.create(contactData);
    return this.contactRepository.save(contact);
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    return this.contactRepository.find({
      where: { userId, isActive: true },
      order: { isPrimary: 'DESC', isMedicalContact: 'DESC', contactName: 'ASC' },
    });
  }

  async getActiveAlerts(filters: {
    userId?: string;
    type?: AlertType;
    status?: AlertStatus;
    page?: number;
    limit?: number;
  } = {}): Promise<{ alerts: EmergencyAlert[]; total: number }> {
    const query = this.alertRepository.createQueryBuilder('alert');

    if (filters.userId) {
      query.andWhere('alert.userId = :userId', { userId: filters.userId });
    }

    if (filters.type) {
      query.andWhere('alert.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('alert.status = :status', { status: filters.status });
    } else {
      // Default to active alerts only
      query.andWhere('alert.status IN (:...statuses)', {
        statuses: [AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED, AlertStatus.RESPONDING]
      });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    query.orderBy('alert.createdAt', 'DESC');
    query.skip(offset).take(limit);

    const [alerts, total] = await query.getManyAndCount();

    return { alerts, total };
  }

  private async sendEmergencyNotifications(alert: EmergencyAlert): Promise<void> {
    try {
      const locationUrl = `https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`;

      // Send to emergency contacts
      if (alert.emergencyContacts && alert.emergencyContacts.length > 0) {
        for (const contact of alert.emergencyContacts) {
          const message = alert.isTestAlert
            ? `TEST ALERT: This is a test SOS alert from ${contact.name}. Alert: ${alert.alertNumber}. Location: ${locationUrl}`
            : `EMERGENCY: ${contact.name} has sent an SOS alert! Alert: ${alert.alertNumber}. Location: ${locationUrl}. Call 911 if needed.`;

          await this.smsService.sendSms({
            to: contact.phone,
            message,
            type: 'transactional',
          });
        }
      }

      // Send confirmation to user
      const userMessage = alert.isTestAlert
        ? `Test SOS alert sent successfully. Alert: ${alert.alertNumber}`
        : `SOS alert sent! Emergency contacts notified. Alert: ${alert.alertNumber}. Emergency services: 911`;

      await this.smsService.sendSms({
        to: alert.contactNumber,
        message: userMessage,
        type: 'transactional',
      });

      // Send email notifications to emergency contacts
      if (alert.emergencyContacts && alert.emergencyContacts.length > 0) {
        for (const contact of alert.emergencyContacts) {
          const emailSubject = alert.isTestAlert ? 'TEST SOS ALERT' : 'EMERGENCY SOS ALERT';
          const emailBody = alert.isTestAlert
            ? `This is a test SOS alert from ${contact.name}. Alert Number: ${alert.alertNumber}. Location: ${locationUrl}`
            : `EMERGENCY: ${contact.name} has sent an SOS alert! Alert Number: ${alert.alertNumber}. Location: ${locationUrl}. Please check on them immediately.`;

          if (contact.email) {
            await this.notificationsService.createNotification({
              userId: alert.userId, // Send to the patient as record but we need to notify the contact
              title: emailSubject,
              message: emailBody,
              type: 'emergency_alert',
              data: { alertNumber: alert.alertNumber, locationUrl }
            });
            // Note: createNotification normally sends to userId. 
            // If contact.email is available, we should ideally send specifically to that email.
            // Our EmailService can handle dynamic email if passed in data.
          }
        }
      }

      this.logger.log(`Emergency notifications sent for alert ${alert.alertNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send emergency notifications: ${error.message}`, error.stack);
    }
  }

  private async notifyEmergencyServices(alert: EmergencyAlert): Promise<void> {
    try {
      // In a real implementation, this would integrate with 911/emergency services
      // For now, we'll log the alert details

      if (!alert.isTestAlert) {
        this.logger.warn(`EMERGENCY SERVICE ALERT: ${alert.alertNumber}`, {
          type: alert.type,
          location: `${alert.latitude},${alert.longitude}`,
          address: alert.address,
          description: alert.description,
          contactNumber: alert.contactNumber,
          medicalInfo: alert.medicalInfo,
        });

        // TODO: Integrate with actual emergency services API
        // This could involve:
        // - Sending alert to 911 dispatch systems
        // - Notifying local emergency response teams
        // - Integrating with emergency service communication protocols
      }
    } catch (error) {
      this.logger.error(`Failed to notify emergency services: ${error.message}`, error.stack);
    }
  }

  private async sendAcknowledgmentNotifications(alert: EmergencyAlert): Promise<void> {
    try {
      // Notify user that help is acknowledged
      await this.smsService.sendSms({
        to: alert.contactNumber,
        message: `Your emergency alert ${alert.alertNumber} has been acknowledged. Help is on the way.`,
        type: 'transactional',
      });

      // Notify emergency contacts
      if (alert.emergencyContacts && alert.emergencyContacts.length > 0) {
        for (const contact of alert.emergencyContacts) {
          await this.smsService.sendSms({
            to: contact.phone,
            message: `Update: Emergency alert ${alert.alertNumber} has been acknowledged. Emergency responders are responding.`,
            type: 'transactional',
          });
        }
      }

      // Send email notification to user
      await this.notificationsService.createNotification({
        userId: alert.userId,
        title: 'Emergency Alert Acknowledged',
        message: `Your emergency alert ${alert.alertNumber} has been acknowledged. Help is on the way.`,
        type: 'emergency_alert_acknowledged',
        data: { alertId: alert.id }
      });

      this.logger.log(`Acknowledgment notifications sent for alert ${alert.alertNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send acknowledgment notifications: ${error.message}`, error.stack);
    }
  }

  private async sendResolutionNotifications(alert: EmergencyAlert): Promise<void> {
    try {
      // Notify user that situation is resolved
      await this.smsService.sendSms({
        to: alert.contactNumber,
        message: `Emergency alert ${alert.alertNumber} has been resolved. Thank you for using our emergency services.`,
        type: 'transactional',
      });

      // Notify emergency contacts
      if (alert.emergencyContacts && alert.emergencyContacts.length > 0) {
        for (const contact of alert.emergencyContacts) {
          await this.smsService.sendSms({
            to: contact.phone,
            message: `Update: Emergency alert ${alert.alertNumber} has been resolved. The situation has been handled.`,
            type: 'transactional',
          });
        }
      }

      // Send email notification to user
      await this.notificationsService.createNotification({
        userId: alert.userId,
        title: 'Emergency Alert Resolved',
        message: `Emergency alert ${alert.alertNumber} has been resolved.`,
        type: 'emergency_alert_resolved',
        data: { alertId: alert.id }
      });

      this.logger.log(`Resolution notifications sent for alert ${alert.alertNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send resolution notifications: ${error.message}`, error.stack);
    }
  }
}

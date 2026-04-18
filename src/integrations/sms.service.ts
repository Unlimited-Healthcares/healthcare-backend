import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Sendchamp from 'sendchamp-sdk';

export interface SmsData {
  to: string;
  message: string;
  from?: string;
  type?: 'transactional' | 'marketing' | 'appointment' | 'verification';
}

export interface SmsResult {
  id: string;
  status: 'queued' | 'sent' | 'delivered' | 'failed';
  to: string;
  message: string;
  sentAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
}

export interface AppointmentData {
  doctor: string;
  date: string;
  time: string;
  patientPhone: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private sendchamp: any;
  private senderId: string;
  private whatsappSender: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDCHAMP_API_KEY');
    this.senderId = this.configService.get<string>('SENDCHAMP_SENDER_ID') || 'Sendchamp';
    this.whatsappSender = this.configService.get<string>('SENDCHAMP_WHATSAPP_SENDER') || '2347067959173';

    if (apiKey) {
      this.sendchamp = new Sendchamp({
        publicKey: apiKey,
        mode: (apiKey.includes('live') ? 'live' : 'test') as any,
      });
      this.logger.log('Messaging service initialized with Sendchamp (HTTP API)');
    } else {
      this.logger.warn('Sendchamp API key not found. Messaging service will run in mock mode.');
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters (like +)
    let formatted = phone.replace(/\D/g, '');
    
    // Handle '00' prefix (international call prefix)
    if (formatted.startsWith('00')) {
      formatted = formatted.substring(2);
    }
    
    // For Nigeria (234), handle cases where people include the leading 0 after the country code
    // e.g. 2340803... -> 234803...
    if (formatted.startsWith('2340')) {
      formatted = '234' + formatted.substring(4);
    }
    
    return formatted;
  }

  async sendSms(smsData: SmsData): Promise<SmsResult> {
    try {
      const formattedTo = this.formatPhoneNumber(smsData.to);
      this.logger.log(`[SMS] Sending to: ${formattedTo} (Source: ${smsData.to})`);

      if (this.sendchamp) {
        const sms = this.sendchamp.SMS;
        const response = await sms.send({
          to: [formattedTo],
          message: smsData.message,
          sender_name: smsData.from || this.senderId,
          route: smsData.type === 'verification' || smsData.type === 'transactional' ? 'dnd' : 'non_dnd',
        });

        const smsResult: SmsResult = {
          id: response.data?.business_id || `sc_${Date.now()}`,
          status: response.code === 200 || response.status === 'success' ? 'sent' : 'failed',
          to: smsData.to,
          message: smsData.message,
          sentAt: new Date(),
        };

        this.logger.log(`SMS sent via Sendchamp: ${smsResult.id}`);
        return smsResult;
      } else {
        // Mock SMS sending
        this.logger.log(`Mock SMS to ${smsData.to}: ${smsData.message}`);
        const smsResult: SmsResult = {
          id: `sms_mock_${Date.now()}`,
          status: 'sent',
          to: smsData.to,
          message: smsData.message,
          sentAt: new Date(),
        };
        return smsResult;
      }
    } catch (error) {
      this.logger.error(`SMS sending failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendWhatsapp(recipient: string, message: string): Promise<any> {
    try {
      const formattedRecipient = this.formatPhoneNumber(recipient);
      this.logger.log(`[WhatsApp] Sending to: ${formattedRecipient} (Source: ${recipient})`);

      if (this.sendchamp) {
        const whatsapp = this.sendchamp.WHATSAPP;
        const response = await whatsapp.sendText({
          sender: this.whatsappSender,
          recipient: formattedRecipient,
          message: message,
        });

        this.logger.log(`WhatsApp message sent via Sendchamp. Status: ${response.status}`);
        return response;
      } else {
        this.logger.log(`Mock WhatsApp to ${recipient}: ${message}`);
        return { status: 'success', message: 'Mock sent' };
      }
    } catch (error) {
      this.logger.error(`WhatsApp sending failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send a templated WhatsApp message (required for initiating chats in WhatsApp)
   */
  async sendWhatsappTemplate(recipient: string, templateCode: string, metaData: any): Promise<any> {
    try {
      const formattedRecipient = this.formatPhoneNumber(recipient);
      this.logger.log(`Sending WhatsApp template ${templateCode} to ${formattedRecipient}`);

      if (this.sendchamp) {
        const whatsapp = this.sendchamp.WHATSAPP;
        const response = await whatsapp.sendTemplate({
          sender: this.whatsappSender,
          recipient: formattedRecipient,
          template_code: templateCode,
          meta_data: metaData,
        });

        this.logger.log(`WhatsApp Template sent via Sendchamp. Status: ${response.status}`);
        return response;
      } else {
        this.logger.log(`Mock WhatsApp Template to ${recipient}: ${templateCode}`);
        return { status: 'success', message: 'Mock sent' };
      }
    } catch (error) {
      this.logger.error(`WhatsApp Template failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSmsStatus(smsId: string): Promise<SmsResult> {
    if (this.sendchamp && !smsId.startsWith('sms_mock_')) {
      try {
        const sms = this.sendchamp.SMS;
        const response = await sms.getStatus(smsId);
        return {
          id: smsId,
          status: response.data?.status === 'delivered' ? 'delivered' : 'sent',
          to: response.data?.recipient || 'unknown',
          message: response.data?.message || '',
          sentAt: response.data?.created_at ? new Date(response.data.created_at) : undefined,
        };
      } catch (error) {
        this.logger.error(`Failed to get SMS status: ${error.message}`);
      }
    }

    // Mock status check
    return {
      id: smsId,
      status: 'delivered',
      to: '+1234567890',
      message: 'Your appointment is confirmed.',
      sentAt: new Date(Date.now() - 300000),
      deliveredAt: new Date(Date.now() - 290000),
    };
  }

  async sendAppointmentReminder(appointmentData: AppointmentData): Promise<SmsResult> {
    const message = `Reminder: Your appointment with ${appointmentData.doctor} is scheduled for ${appointmentData.date} at ${appointmentData.time}. Please arrive 15 minutes early.`;

    // Try WhatsApp first, then SMS
    try {
      await this.sendWhatsapp(appointmentData.patientPhone, message);
    } catch (e) {
      this.logger.warn(`Failed to send WhatsApp reminder: ${e.message}, falling back to SMS`);
    }

    return await this.sendSms({
      to: appointmentData.patientPhone,
      message,
      type: 'appointment',
    });
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<SmsResult> {
    const message = `Your verification code is: ${code}. This code will expire in 30 minutes.`;

    // For verification codes, people generally prefer SMS as it's more reliable/universal
    return await this.sendSms({
      to: phoneNumber,
      message,
      type: 'verification',
    });
  }

  async sendWhatsappVerificationCode(phoneNumber: string, code: string): Promise<any> {
    const message = `Your verification code is: *${code}*. This code will expire in 30 minutes.`;
    return await this.sendWhatsapp(phoneNumber, message);
  }

  async sendTestResultNotification(patientPhone: string, testType: string): Promise<SmsResult> {
    const message = `Your ${testType} results are now available. Please log in to your patient portal to view them or contact your healthcare provider.`;

    // Try WhatsApp first, then fallback to SMS
    try {
      await this.sendWhatsapp(patientPhone, message);
    } catch (e) {
       this.logger.warn(`Failed to send WhatsApp test result notification: ${e.message}, falling back to SMS`);
    }

    return await this.sendSms({
      to: patientPhone,
      message,
      type: 'transactional',
    });
  }
}

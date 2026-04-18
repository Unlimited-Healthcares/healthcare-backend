import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Notification } from './entities/notification.entity';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

interface ClinicalMetadata {
  patientName?: string;
  patientId?: string;
  priority?: string;
  serviceRequested?: string;
  title?: string;
  clinicalNote?: string;
  reason?: string;
  cancelReason?: string;
  vitals?: Record<string, string>;
  prescriptionDetails?: {
    dosage: string;
    frequency: string;
    duration: string;
  };
  radiotherapyDetails?: {
    targetArea: string;
    technique: string;
    dose: string;
    cycles: string;
  };
  reportDetails?: {
    findings: string;
    impression: string;
    recommendations: string;
    specimenType: string;
    labNumber: string;
  };
  sceneCondition?: string;
  destinationHospital?: string;
  dispatchTime?: string;
  arrivalTime?: string;
  cprConsent?: string;
  [key: string]: unknown;
}

@Injectable()
export class EmailNotificationService {
  private readonly logger = new Logger(EmailNotificationService.name);
  private resend: Resend;
  private smtpTransporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.initializeEmailServices();
  }

  private initializeEmailServices() {
    // 1. Sanitize Resend Configuration
    const rawApiKey = this.configService.get<string>('RESEND_API_KEY');
    const apiKey = rawApiKey?.trim().replace(/^["']|["']$/g, '');

    if (apiKey && apiKey.startsWith('re_')) {
      this.resend = new Resend(apiKey);
      this.logger.log('Notifications Email service initialized with Resend');
    } else {
      this.logger.warn('RESEND_API_KEY missing or invalid. Relying on SMTP if configured.');
    }

    // 2. Initialize SMTP Fallback (Nodemailer)
    const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT')) || 587;
    const smtpUser = this.configService.get<string>('SMTP_USER') || this.configService.get<string>('EMAIL_USER');
    const smtpPass = this.configService.get<string>('SMTP_PASS') || this.configService.get<string>('EMAIL_PASSWORD');

    if (smtpUser && smtpPass) {
      this.smtpTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log(`Notifications SMTP fallback initialized (User: ${smtpUser})`);
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<void> {
    const from = (this.configService.get<string>('EMAIL_FROM') || 'onboarding@resend.dev')
      .trim().replace(/^["']|["']$/g, '');

    // Priority 1: Resend
    if (this.resend) {
      try {
        this.logger.log(`Attempting Resend notification to ${options.to}...`);
        const { data, error } = await this.resend.emails.send({
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        });

        if (!error) {
          this.logger.log(`Notification email sent via Resend to: ${options.to}. ID: ${data?.id}`);
          return;
        }
        this.logger.error(`Resend notification failed: ${error.message}`);
      } catch (error) {
        this.logger.error(`Unexpected Resend notification failure: ${error.message}`);
      }
    }

    // Priority 2: SMTP Fallback
    if (this.smtpTransporter) {
      try {
        this.logger.log(`Falling back to SMTP for notification to ${options.to}...`);
        await this.smtpTransporter.sendMail({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
        });
        this.logger.log(`Notification email sent via SMTP to: ${options.to}`);
        return;
      } catch (error) {
        this.logger.error(`SMTP notification fallback also failed: ${error.message}`);
      }
    }

    throw new Error('All email notification delivery methods failed');
  }

  async sendEmailNotification(notification: Notification): Promise<void> {
    try {
      this.logger.log(`Sending email notification: ${notification.title} to user ${notification.userId}`);

      const user = await this.userRepository.findOne({
        where: { id: notification.userId },
        select: ['email']
      });

      if (!user || !user.email) {
        throw new Error(`Could not find email address for user ${notification.userId}`);
      }

      const data = notification.data || {};
      const requestType = (data.requestType as string) || notification.type;
      const formattedType = requestType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const metadata = (data.metadata as ClinicalMetadata) || {};

      let metadataHtml = '';
      if (Object.keys(metadata).length > 0) {
        metadataHtml = `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #4a5568; font-size: 16px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(metadata)
            .filter(([key]) => !['id', 'senderId', 'recipientId', 'status'].includes(key))
            .map(([key, value]) => `
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f7fafc; color: #718096; width: 40%; font-size: 14px;">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #f7fafc; color: #2d3748; font-weight: 600; font-size: 14px;">${typeof value === 'object' ? JSON.stringify(value) : value}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        `;
      }

      const isClinical = [
        'referral', 'diagnostic', 'pharmacy', 'imaging', 'prescription', 'radiotherapy', 'report', 'care_task',
        'appointment', 'call', 'treatment', 'prescription_proposal', 'transfer',
        'medical_report_proposal', 'care_task_proposal', 'clinical_request'
      ].includes(requestType.toLowerCase());

      let clinicalHtml = '';
      if (isClinical) {
        clinicalHtml = `
          <div style="margin-bottom: 30px; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; background-color: #f8fafc;">
            <div style="text-align: center; border-bottom: 1px dashed #cbd5e0; padding-bottom: 15px; margin-bottom: 20px;">
              <h3 style="margin: 0; color: #2d3748; font-size: 18px; text-transform: uppercase; letter-spacing: 2px;">OFFICIAL CLINICAL DOCUMENT</h3>
              <p style="margin: 5px 0 0 0; color: #718096; font-size: 11px; font-weight: bold;">VALIDATED VIA DIGITAL TELEMETRY VAULT</p>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 15px;">
                  <p style="margin: 0; font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Patient Information</p>
                  <p style="margin: 4px 0 0 0; color: #1a202c; font-size: 16px; font-weight: 800; border-bottom: 2px solid #edf2f7; padding-bottom: 5px;">${metadata.patientName || 'N/A'}</p>
                  <p style="margin: 5px 0 0 0; color: #718096; font-size: 12px;">ID: ${metadata.patientId ? metadata.patientId.substring(0, 12).toUpperCase() : '----'}</p>
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                  <p style="margin: 0; font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Priority Status</p>
                  <div style="display: inline-block; margin-top: 5px; padding: 4px 12px; background-color: ${metadata.priority === 'emergency' ? '#fff5f5' : (metadata.priority === 'urgent' ? '#fffaf0' : '#f0fff4')}; border: 1px solid ${metadata.priority === 'emergency' ? '#feb2b2' : (metadata.priority === 'urgent' ? '#fbd38d' : '#9ae6b4')}; border-radius: 20px; color: ${metadata.priority === 'emergency' ? '#c53030' : (metadata.priority === 'urgent' ? '#9c4221' : '#276749')}; font-size: 11px; font-weight: 800; text-transform: uppercase;">
                    ${metadata.priority || 'Routine'}
                  </div>
                </td>
              </tr>
            </table>

            <div style="margin-bottom: 20px;">
              <p style="margin: 0; font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Specific Service / Indication</p>
              <p style="margin: 5px 0 0 0; color: #2d3748; font-size: 14px; font-weight: 700;">${metadata.serviceRequested || metadata.title || formattedType}</p>
            </div>

            ${metadata.clinicalNote || metadata.reason || metadata.cancelReason || notification.message ? `
            <div style="margin-bottom: 20px; background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #3182ce;">
              <p style="margin: 0; font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Clinical Summary & Rationale</p>
              <p style="margin: 0; color: #2d3748; font-size: 14px; line-height: 1.6; font-style: italic;">"${metadata.clinicalNote || metadata.reason || metadata.cancelReason || notification.message}"</p>
            </div>
            ` : ''}

            ${metadata.diagnosis || metadata.findings || metadata.conclusion || metadata.impression ? `
            <div style="margin-bottom: 20px; background-color: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #805ad5;">
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #a0aec0; text-transform: uppercase; font-weight: bold;">Health Status & Report Documentation</p>
              ${metadata.diagnosis ? `<p style="margin: 0 0 8px 0; color: #2d3748; font-size: 14px;"><strong style="color: #4a5568;">Primary Diagnosis:</strong> ${metadata.diagnosis}</p>` : ''}
              ${metadata.findings || metadata.reportDetails?.findings ? `<p style="margin: 0 0 8px 0; color: #2d3748; font-size: 13px; line-height: 1.5;"><strong style="color: #4a5568;">Findings:</strong> ${metadata.findings || metadata.reportDetails?.findings}</p>` : ''}
              ${metadata.conclusion || metadata.impression || metadata.reportDetails?.impression ? `<p style="margin: 0; color: #2d3748; font-size: 13px; line-height: 1.5;"><strong style="color: #4a5568;">Impression/Conclusion:</strong> ${metadata.conclusion || metadata.impression || metadata.reportDetails?.impression}</p>` : ''}
              ${metadata.reportDetails?.labNumber ? `<p style="margin: 8px 0 0 0; color: #718096; font-size: 11px;">Lab Ref: ${metadata.reportDetails.labNumber} · Specimen: ${metadata.reportDetails.specimenType || 'N/A'}</p>` : ''}
            </div>
            ` : ''}

            ${metadata.prescriptionDetails ? `
            <div style="margin-bottom: 20px; background-color: #fffaf0; padding: 15px; border-radius: 8px; border-left: 4px solid #ecc94b;">
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #b7791f; text-transform: uppercase; font-weight: bold;">Prescription Order</p>
              <p style="margin: 0 0 5px 0; color: #2d3748; font-size: 14px;"><strong>Dosage:</strong> ${metadata.prescriptionDetails.dosage}</p>
              <p style="margin: 0 0 5px 0; color: #2d3748; font-size: 14px;"><strong>Frequency:</strong> ${metadata.prescriptionDetails.frequency}</p>
              <p style="margin: 0; color: #2d3748; font-size: 14px;"><strong>Duration:</strong> ${metadata.prescriptionDetails.duration}</p>
            </div>
            ` : ''}

            ${metadata.radiotherapyDetails ? `
            <div style="margin-bottom: 20px; background-color: #faf5ff; padding: 15px; border-radius: 8px; border-left: 4px solid #9f7aea;">
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #6b46c1; text-transform: uppercase; font-weight: bold;">Radiotherapy Specification</p>
              <p style="margin: 0 0 5px 0; color: #2d3748; font-size: 14px;"><strong>Target Area:</strong> ${metadata.radiotherapyDetails.targetArea}</p>
              <p style="margin: 0 0 5px 0; color: #2d3748; font-size: 14px;"><strong>Dose/Cycles:</strong> ${metadata.radiotherapyDetails.dose} Gy / ${metadata.radiotherapyDetails.cycles} cycles</p>
              <p style="margin: 0; color: #2d3748; font-size: 14px;"><strong>Technique:</strong> ${metadata.radiotherapyDetails.technique || 'External Beam'}</p>
            </div>
            ` : ''}

            ${metadata.sceneCondition || metadata.destinationHospital ? `
            <div style="margin-bottom: 20px; background-color: #fff5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #f56565;">
              <p style="margin: 0 0 10px 0; font-size: 10px; color: #c53030; text-transform: uppercase; font-weight: bold;">Ambulance Transfer Logistics</p>
              <p style="margin: 0 0 5px 0; color: #2d3748; font-size: 13px;"><strong>Destination:</strong> ${metadata.destinationHospital}</p>
              <p style="margin: 0 0 5px 0; color: #2d3748; font-size: 13px;"><strong>Scene status:</strong> ${metadata.sceneCondition}</p>
              <p style="margin: 0; color: #718096; font-size: 11px;">Timings: Dispatch: ${metadata.dispatchTime || '—'} · Arrival: ${metadata.arrivalTime || '—'}</p>
            </div>
            ` : ''}

            ${metadata.vitals ? `
            <div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0; font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">Snapshot Vitals</p>
              <table style="width: 100%; font-size: 12px;">
                <tr>
                   ${Object.entries(metadata.vitals).map(([k, v]) => v ? `<td style="color: #475569;"><strong>${k.toUpperCase()}:</strong> ${v}</td>` : '').join('')}
                </tr>
              </table>
            </div>
            ` : ''}

            <div style="margin-top: 20px; pt: 10px; border-top: 1px dashed #cbd5e0; display: flex; justify-content: space-between; align-items: end;">
               <div>
                  <p style="margin: 0; font-size: 10px; color: #a0aec0; italic">Issued: ${new Date().toLocaleString()}</p>
               </div>
               <div style="text-align: right">
                  <p style="margin: 0; font-size: 9px; color: #3182ce; font-weight: bold; text-transform: uppercase;">Digitally Authorized</p>
               </div>
            </div>
          </div>
        `;
      }

      const dashboardUrl = this.configService.get('FRONTEND_URL') || 'https://unlimitedhealthcares.com';

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 40px; border-radius: 16px; background-color: #ffffff; color: #1a202c;">
          <!-- Header -->
          <div style="border-bottom: 2px solid #3182ce; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: top;">
            <div>
              <h2 style="margin: 0; color: #2d3748; text-transform: uppercase; letter-spacing: 1px; font-size: 20px;">${isClinical ? formattedType : notification.title}</h2>
              <p style="margin: 4px 0 0 0; color: #718096; font-size: 12px; font-weight: bold;">REF: ${notification.id.substring(0, 8).toUpperCase()}</p>
            </div>
            <div style="text-align: right; color: #718096; font-size: 13px;">
              ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          <!-- Summary Box -->
          ${isClinical || (data.senderName || data.recipientName) ? `
          <div style="background-color: #ebf8ff; padding: 20px; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #3182ce;">
            <div style="display: flex; flex-direction: column; gap: 8px;">
              <p style="margin: 0; font-size: 14px;"><strong>From:</strong> ${data.senderName || 'Unlimited Healthcare Platform'}</p>
              <p style="margin: 0; font-size: 14px;"><strong>To:</strong> ${data.recipientName || 'Authorized User'}</p>
              <p style="margin: 4px 0 0 0; font-size: 14px;"><strong>Purpose:</strong> ${notification.title}</p>
            </div>
          </div>
          ` : ''}

          ${isClinical ? clinicalHtml : `
            <!-- Message -->
            <div style="margin-bottom: 30px;">
              <h3 style="color: #4a5568; font-size: 16px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px;">Notice</h3>
              <p style="color: #2d3748; line-height: 1.6; font-size: 15px; margin-top: 12px;">${notification.message}</p>
              ${data.message && data.message !== notification.message ? `<p style="color: #4a5568; line-height: 1.6; font-size: 14px; font-style: italic; background: #f7fafc; padding: 10px; border-radius: 8px;">"${data.message}"</p>` : ''}
            </div>

            <!-- Metadata Table -->
            ${metadataHtml}
          `}

          <!-- Action Button -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #edf2f7; text-align: center;">
            <p style="color: #718096; font-size: 13px; margin-bottom: 20px;">${isClinical ? 'Please review this clinical proposal and respond via the secure professional dashboard.' : 'You can view more details and manage your account via your dashboard.'}</p>
            <a href="${dashboardUrl}" style="background-color: #3182ce; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 6px rgba(49, 130, 206, 0.2);">${isClinical ? 'Respond on Dashboard' : 'Go to Dashboard'}</a>
          </div>
          
          <!-- Footer -->
          <div style="margin-top: 40px; text-align: center; color: #a0aec0; font-size: 11px; letter-spacing: 0.5px;">
            &copy; ${new Date().getFullYear()} Unlimited Healthcare Platform<br/>
            Secure Clinical Telemetry System
          </div>
        </div>
      `;

      await this.sendEmail({
        to: user.email,
        subject: isClinical ? `[Unlimited Healthcare] Clinical Request: ${formattedType}` : `[Unlimited Healthcare] ${notification.title}`,
        html: emailHtml,
      });

      this.logger.log(`Email notification sent successfully: ${notification.id}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`, error.stack);
      // Don't throw here to prevent breaking the flow if email fails
    }
  }
}

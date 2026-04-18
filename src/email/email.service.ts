import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as nodemailer from 'nodemailer';

export interface SupportTicketData {
  id: string;
  subject: string;
  name: string;
  email: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string | Date;
  metadata?: Record<string, unknown>;
}

export interface EmailNotificationData {
  id: string;
  title: string;
  message: string;
  user?: { email: string };
  email?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private resend: Resend;
  private smtpTransporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    // 1. Sanitize Resend Configuration
    const rawApiKey = this.configService.get<string>('RESEND_API_KEY');
    const apiKey = rawApiKey?.trim().replace(/^["']|["']$/g, '');

    this.fromEmail = (this.configService.get<string>('EMAIL_FROM') || 'codesphere@unlimitedhealthcares.com')
      .trim().replace(/^["']|["']$/g, '');

    if (apiKey && apiKey.startsWith('re_')) {
      this.resend = new Resend(apiKey);
      this.logger.log(`Email service initialized with Resend (Sender: ${this.fromEmail})`);
    } else {
      this.logger.warn('Resend API key missing or invalid format. Will rely on SMTP if configured.');
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
      this.logger.log(`SMTP fallback initialized (User: ${smtpUser})`);
    }
  }

  async sendVerificationEmail(email: string, token: string, firstName?: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('WEB_APP_URL') ||
      'https://unlimitedhealthcares.com';
    const verificationLink = `${frontendUrl}/auth?tab=verify&token=${token}&email=${encodeURIComponent(email)}`;

    const greeting = firstName ? `Hello ${firstName},` : '';
    const supportEmail = this.configService.get<string>('SUPPORT_EMAIL') || 'codesphere@unlimitedhealthcares.com';

    const subject = 'Your verification code';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #0d9488; margin: 0; font-size: 20px; font-weight: 600;">Unlimited Health</h2>
        </div>
        <h3 style="color: #1e293b; font-size: 22px; margin: 0 0 8px; font-weight: 700;">Your verification code</h3>
        ${greeting ? `<p style="color: #475569; font-size: 16px; margin: 0 0 16px;">${greeting}</p>` : ''}
        <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; margin: 24px 0; color: #0d9488; font-family: 'Courier New', monospace;">
          ${token}
        </div>
        <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0 0 8px;">
          Enter this code in the app to verify your email.
        </p>
        <p style="color: #64748b; font-size: 15px; line-height: 1.5; margin: 0 0 20px;">
          This code expires in <strong>30 minutes</strong>.
        </p>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 20px;">
          Verification code: <strong>${token}</strong>
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${verificationLink}" style="background-color: #0d9488; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 15px;">
            Verify email
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 13px; margin: 24px 0 0; padding-top: 16px; border-top: 1px solid #e2e8f0;">
          For your security, do not share this code. Unlimited Health will never ask for it.
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 12px 0 0;">
          If you didn't request this, ignore this email. Questions? Contact <a href="mailto:${supportEmail}" style="color: #0d9488;">${supportEmail}</a>
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ||
      this.configService.get<string>('WEB_APP_URL') ||
      'https://unlimitedhealthcares.com';
    const resetLink = `${frontendUrl}/auth?tab=reset&token=${token}`;

    const subject = 'Reset your password - Unlimited Health';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #2c5aa0;">Unlimited Health</h2>
        </div>
        <h3 style="color: #333;">Password Reset Request</h3>
        <p style="color: #666; line-height: 1.6;">
          We received a request to reset your password. Click the button below to create a new password.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetLink}" style="color: #2c5aa0;">${resetLink}</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendSupportTicketEmail(email: string, ticketData: SupportTicketData): Promise<boolean> {
    const supportEmail = this.configService.get<string>('SUPPORT_EMAIL') || 'codesphere@unlimitedhealthcares.com';
    const subject = `Support Ticket Created: [${ticketData.id}] - ${ticketData.subject}`;

    // 1. Notify the User (Confirmation)
    const userHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2c5aa0;">Support Ticket Received</h2>
        <p>Hello ${ticketData.name},</p>
        <p>Your support ticket has been successfully received. Our team will review it and get back to you shortly.</p>
        <div style="background: #f4f4f4; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <strong>Ticket ID:</strong> ${ticketData.id}<br/>
          <strong>Subject:</strong> ${ticketData.subject}<br/>
          <strong>Priority:</strong> ${ticketData.priority}<br/>
          <strong>Status:</strong> ${ticketData.status}
        </div>
        <p>You can track your ticket status directly in the support dashboard.</p>
        <hr style="border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="color: #999; font-size: 12px;">© 2026 Unlimited Healthcare Support Center</p>
      </div>
    `;

    // 2. Notify the Support Team (Internal Alert)
    const supportHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #d32f2f;">New Support Ticket Created</h2>
        <div style="background: #fff8f8; padding: 15px; border-radius: 4px; border-left: 4px solid #d32f2f; margin: 20px 0;">
          <strong>From:</strong> ${ticketData.name} (${ticketData.email})<br/>
          <strong>Subject:</strong> ${ticketData.subject}<br/>
          <strong>Priority:</strong> ${ticketData.priority}<br/>
          <strong>Timestamp:</strong> ${ticketData.createdAt}
        </div>
        <div style="padding: 15px; border: 1px solid #eee; border-radius: 4px; margin-bottom: 20px;">
          <strong>Description:</strong><br/>
          <p style="white-space: pre-wrap;">${ticketData.description}</p>
        </div>
        <div style="padding: 10px; background: #f9f9f9; font-family: monospace; font-size: 11px;">
          <strong>Metadata:</strong><br/>
          ${JSON.stringify(ticketData.metadata || {}, null, 2)}
        </div>
        <div style="margin-top: 20px;">
          <a href="https://unlimitedhealthcares.com/admin/tickets/${ticketData.id}" style="background: #2c5aa0; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Manage Ticket
          </a>
        </div>
      </div>
    `;

    // Send both emails
    const userResult = await this.sendEmail(email, subject, userHtml);
    const supportResult = await this.sendEmail(supportEmail, `[ADMIN ALERT] New Ticket: ${ticketData.subject}`, supportHtml);

    return userResult && supportResult;
  }

  public async sendEmailNotification(notification: EmailNotificationData, email?: string): Promise<boolean> {
    const targetEmail = email || notification.user?.email || notification.email;
    if (!targetEmail) {
      this.logger.warn(`Cannot send email notification: no email found for notification ${notification.id}`);
      return false;
    }

    const subject = notification.title;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; border-top: 4px solid #0d9488;">
        <h2 style="color: #0d9488; margin-top: 0;">Unlimited Health Notification</h2>
        <h3 style="color: #333;">${notification.title}</h3>
        <p style="color: #666; line-height: 1.6;">
          ${notification.message}
        </p>
        ${notification.data && Object.keys(notification.data).length > 0 ? `
          <div style="background: #f8fafc; padding: 12px; border-radius: 4px; border: 1px solid #e2e8f0; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0; color: #64748b; font-weight: 600;">Details:</p>
            <pre style="white-space: pre-wrap; margin: 8px 0 0; color: #475569;">${JSON.stringify(notification.data, null, 2)}</pre>
          </div>
        ` : ''}
        <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
           <p style="color: #94a3b8; font-size: 12px;">This is an automated notification from your Unlimited Healthcare account.</p>
           <p style="color: #94a3b8; font-size: 12px;">You can manage your notification preferences in your profile settings.</p>
        </div>
      </div>
    `;

    return this.sendEmail(targetEmail, subject, html);
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<boolean> {
    const subject = 'Welcome to Unlimited Healthcare!';
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
           <h1 style="color: #0d9488; margin: 0;">Unlimited Health</h1>
        </div>
        <h2 style="color: #1e293b; font-size: 24px; font-weight: 700; margin-bottom: 16px;">Welcome aboard!</h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">${greeting}</p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          We're thrilled to have you at Unlimited Healthcare. Our platform is designed to provide you with seamless access to medical records, appointments, and expert care.
        </p>
        <div style="margin: 32px 0;">
          <h3 style="color: #1e293b; font-size: 18px; margin-bottom: 12px;">Getting Started:</h3>
          <ul style="color: #475569; padding-left: 20px; line-height: 1.8;">
            <li>Complete your profile setup</li>
            <li>Verify your identity documents (KYC)</li>
            <li>Connect with healthcare providers</li>
          </ul>
        </div>
        <div style="text-align: center; margin-top: 32px;">
          <a href="https://unlimitedhealthcares.com/onboarding" style="background: #0d9488; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Get Started</a>
        </div>
      </div>
    `;
    return this.sendEmail(email, subject, html);
  }

  private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    // Priority 1: Resend
    if (this.resend) {
      try {
        this.logger.log(`Attempting Resend delivery to ${to}...`);
        const { data, error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: [to],
          subject: subject,
          html: html,
        });

        if (!error) {
          this.logger.log(`Email sent via Resend. ID: ${data?.id}`);
          return true;
        }

        this.logger.error(`Resend failed: ${error.message} - ${JSON.stringify(error)}`);
      } catch (error) {
        this.logger.error(`Unexpected Resend failure: ${error.message}`);
      }
    }

    // Priority 2: SMTP Fallback
    if (this.smtpTransporter) {
      try {
        this.logger.log(`Falling back to SMTP delivery for ${to}...`);
        await this.smtpTransporter.sendMail({
          from: this.fromEmail,
          to: to,
          subject: subject,
          html: html,
        });
        this.logger.log(`Email successfully sent via SMTP fallback to ${to}`);
        return true;
      } catch (error) {
        this.logger.error(`SMTP Fallback also failed: ${error.message}`);
      }
    }

    this.logger.error(`All email delivery methods failed for ${to}`);
    return false;
  }
}

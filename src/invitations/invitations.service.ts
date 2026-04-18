import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from './entities/invitation.entity';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { DeclineInvitationDto } from './dto/decline-invitation.dto';
import { SafeUserDto } from '../users/dto/safe-user.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailNotificationService } from '../notifications/email-notification.service';
import { CentersService } from '../centers/centers.service';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailNotificationService,
    private readonly centersService: CentersService,
  ) { }

  async createInvitation(createInvitationDto: CreateInvitationDto, senderId: string): Promise<Invitation> {
    try {
      this.logger.debug(`Creating invitation for email: ${createInvitationDto.email}`);

      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(createInvitationDto.email);
      if (existingUser) {
        // Send both in-app notification and email for existing users
        await this.notificationsService.createNotification({
          userId: existingUser.id,
          type: 'invitation_received',
          title: 'New Invitation',
          message: `You have a new ${createInvitationDto.invitationType} invitation`,
          data: { invitationData: createInvitationDto }
        });

        // Send email notification to existing user
        await this.sendExistingUserInvitationEmail(existingUser, createInvitationDto);

        throw new ConflictException('User already exists. Email and in-app notification sent.');
      }

      // Generate unique token
      const token = this.generateInvitationToken();

      // Create invitation record
      const invitation = this.invitationRepository.create({
        email: createInvitationDto.email,
        invitationType: createInvitationDto.invitationType as any,
        role: createInvitationDto.role,
        message: createInvitationDto.message,
        centerId: createInvitationDto.centerId,
        metadata: createInvitationDto.metadata,
        token,
        senderId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const savedInvitation = await this.invitationRepository.save(invitation);

      // Send email invitation
      await this.sendInvitationEmail(savedInvitation);

      this.logger.debug(`Invitation created successfully: ${savedInvitation.id}`);
      return savedInvitation;
    } catch (error) {
      this.logger.error(`Error creating invitation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async acceptInvitation(token: string, acceptDto: AcceptInvitationDto): Promise<User> {
    try {
      this.logger.debug(`Accepting invitation with token: ${token}`);

      const invitation = await this.findInvitationByToken(token);

      if (invitation.status !== 'pending') {
        throw new BadRequestException('Invitation already processed');
      }

      if (invitation.expiresAt < new Date()) {
        throw new BadRequestException('Invitation has expired');
      }

      // Create user account
      const nameParts = acceptDto.name.split(' ');
      const user = await this.usersService.create({
        email: invitation.email,
        password: acceptDto.password,
        roles: [invitation.role || 'patient'],
        profile: {
          ...acceptDto.profileData,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' '),
          phone: acceptDto.phone,
        },
      });

      // Update invitation status
      invitation.status = 'accepted';
      invitation.acceptedAt = new Date();
      await this.invitationRepository.save(invitation);

      // Auto-add to center if staff invitation
      if (invitation.invitationType === 'staff_invitation' && invitation.centerId) {
        await this.centersService.addStaffMember(invitation.centerId, user.id, invitation.role);
      }

      // Send welcome notification
      await this.notificationsService.createNotification({
        userId: user.id,
        type: 'welcome',
        title: 'Welcome to Unlimited Health!',
        message: 'Your account has been created successfully.',
      });

      this.logger.debug(`Invitation accepted successfully for user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error accepting invitation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async acceptInvitationSafe(token: string, acceptDto: AcceptInvitationDto): Promise<SafeUserDto> {
    const user = await this.acceptInvitation(token, acceptDto);
    return this.usersService.transformToSafeUser(user);
  }

  async declineInvitation(token: string, _declineDto: DeclineInvitationDto): Promise<void> {
    try {
      this.logger.debug(`Declining invitation with token: ${token}`);

      const invitation = await this.findInvitationByToken(token);

      if (invitation.status !== 'pending') {
        throw new BadRequestException('Invitation already processed');
      }

      invitation.status = 'declined';
      invitation.declinedAt = new Date();
      await this.invitationRepository.save(invitation);

      this.logger.debug(`Invitation declined successfully: ${invitation.id}`);
    } catch (error) {
      this.logger.error(`Error declining invitation: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPendingInvitations(email: string): Promise<Invitation[]> {
    try {
      this.logger.debug(`Getting pending invitations for email: ${email}`);

      const invitations = await this.invitationRepository
        .createQueryBuilder('invitation')
        .leftJoinAndSelect('invitation.center', 'center')
        .leftJoinAndSelect('invitation.sender', 'sender')
        .where('invitation.email = :email', { email })
        .andWhere('invitation.status = :status', { status: 'pending' })
        .andWhere('invitation.expiresAt > :now', { now: new Date() })
        .getMany();

      this.logger.debug(`Found ${invitations.length} pending invitations for email: ${email}`);
      return invitations;
    } catch (error) {
      this.logger.error(`Error getting pending invitations: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getInvitationById(id: string): Promise<Invitation> {
    try {
      this.logger.debug(`Getting invitation by ID: ${id}`);

      const invitation = await this.invitationRepository
        .createQueryBuilder('invitation')
        .leftJoinAndSelect('invitation.center', 'center')
        .leftJoinAndSelect('invitation.sender', 'sender')
        .where('invitation.id = :id', { id })
        .getOne();

      if (!invitation) {
        throw new NotFoundException('Invitation not found');
      }

      this.logger.debug(`Found invitation: ${invitation.id}`);
      return invitation;
    } catch (error) {
      this.logger.error(`Error getting invitation by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getInvitationsByCenter(centerId: string, page: number = 1, limit: number = 10): Promise<{ invitations: Invitation[]; total: number; page: number; hasMore: boolean }> {
    try {
      this.logger.debug(`Getting invitations for center: ${centerId}, page: ${page}, limit: ${limit}`);

      const queryBuilder = this.invitationRepository
        .createQueryBuilder('invitation')
        .leftJoinAndSelect('invitation.center', 'center')
        .leftJoinAndSelect('invitation.sender', 'sender')
        .where('invitation.centerId = :centerId', { centerId })
        .orderBy('invitation.createdAt', 'DESC');

      const total = await queryBuilder.getCount();

      const invitations = await queryBuilder
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      const hasMore = page * limit < total;

      this.logger.debug(`Found ${invitations.length} invitations for center: ${centerId} (total: ${total})`);

      return {
        invitations,
        total,
        page,
        hasMore
      };
    } catch (error) {
      this.logger.error(`Error getting invitations by center: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async findInvitationByToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { token },
      relations: ['center', 'sender']
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    return invitation;
  }

  private async sendInvitationEmail(invitation: Invitation): Promise<void> {
    try {
      this.logger.debug(`Sending invitation email to: ${invitation.email}`);

      const registrationLink = `${process.env.FRONTEND_URL}/invitation/accept?token=${invitation.token}`;

      const template = this.getEmailTemplate(invitation.invitationType);
      const subject = template.subject.replace('{centerName}', invitation.center?.name || 'Our Platform');
      const htmlContent = template.htmlContent
        .replace('{centerName}', invitation.center?.name || 'Our Platform')
        .replace('{role}', invitation.role || 'member')
        .replace('{message}', invitation.message || '')
        .replace('{registrationLink}', registrationLink);

      // Send actual email
      await this.emailService.sendEmail({
        to: invitation.email,
        subject,
        html: htmlContent,
      });

      this.logger.log(`Invitation email sent successfully to: ${invitation.email}`);
    } catch (error) {
      this.logger.error(`Error sending invitation email: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendExistingUserInvitationEmail(user: User, invitationData: CreateInvitationDto): Promise<void> {
    try {
      this.logger.debug(`Sending invitation email to existing user: ${user.email}`);

      const loginLink = `${process.env.FRONTEND_URL}/login`;
      const dashboardLink = `${process.env.FRONTEND_URL}/dashboard`;

      const template = this.getExistingUserEmailTemplate(invitationData.invitationType);
      const subject = template.subject.replace('{centerName}', invitationData.centerId ? 'Healthcare Center' : 'Our Platform');
      const htmlContent = template.htmlContent
        .replace('{userName}', user.profile?.firstName || user.email)
        .replace('{centerName}', invitationData.centerId ? 'Healthcare Center' : 'Our Platform')
        .replace('{role}', invitationData.role || 'member')
        .replace('{message}', invitationData.message || '')
        .replace('{loginLink}', loginLink)
        .replace('{dashboardLink}', dashboardLink);

      // Send actual email
      await this.emailService.sendEmail({
        to: user.email,
        subject,
        html: htmlContent,
      });

      this.logger.log(`Invitation email sent successfully to existing user: ${user.email}`);
    } catch (error) {
      this.logger.error(`Error sending invitation email to existing user: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private getEmailTemplate(invitationType: string) {
    const templates = {
      staff_invitation: {
        subject: "You're invited to join {centerName}",
        htmlContent: `
          <h2>Join {centerName} Healthcare Team</h2>
          <p>You've been invited to join our healthcare team as a {role}.</p>
          <p>Message: {message}</p>
          <a href="{registrationLink}">Accept Invitation & Register</a>
          <p>This invitation expires in 7 days.</p>
        `,
      },
      doctor_invitation: {
        subject: "Connect with {senderName} on Unlimited Health",
        htmlContent: `
          <h2>Professional Connection Request</h2>
          <p>{senderName} wants to connect with you on our healthcare platform.</p>
          <p>Message: {message}</p>
          <a href="{registrationLink}">Join & Connect</a>
        `,
      },
      patient_invitation: {
        subject: "Your doctor invites you to join Unlimited Health",
        htmlContent: `
          <h2>Join Your Healthcare Network</h2>
          <p>Dr. {doctorName} invites you to join our patient portal.</p>
          <p>Message: {message}</p>
          <a href="{registrationLink}">Join as Patient</a>
        `,
      },
      collaboration_invitation: {
        subject: "Collaboration Invitation on Unlimited Health",
        htmlContent: `
          <h2>Professional Collaboration Invitation</h2>
          <p>You've been invited to collaborate on our healthcare platform.</p>
          <p>Message: {message}</p>
          <a href="{registrationLink}">Join & Collaborate</a>
        `,
      }
    };
    return templates[invitationType] || templates.doctor_invitation;
  }

  private getExistingUserEmailTemplate(invitationType: string) {
    const templates = {
      staff_invitation: {
        subject: "New invitation to join {centerName} team",
        htmlContent: `
          <h2>New Team Invitation</h2>
          <p>Hello {userName},</p>
          <p>You have received a new invitation to join the {centerName} healthcare team as a {role}.</p>
          <p><strong>Message:</strong> {message}</p>
          <p>Since you already have an account, you can:</p>
          <ul>
            <li><a href="{loginLink}">Log in to your account</a> to view the invitation</li>
            <li><a href="{dashboardLink}">Go to your dashboard</a> to manage invitations</li>
          </ul>
          <p>You will also receive an in-app notification about this invitation.</p>
        `,
      },
      doctor_invitation: {
        subject: "New professional connection request",
        htmlContent: `
          <h2>New Connection Request</h2>
          <p>Hello {userName},</p>
          <p>You have received a new professional connection request on our healthcare platform.</p>
          <p><strong>Message:</strong> {message}</p>
          <p>Since you already have an account, you can:</p>
          <ul>
            <li><a href="{loginLink}">Log in to your account</a> to view the request</li>
            <li><a href="{dashboardLink}">Go to your dashboard</a> to manage connections</li>
          </ul>
          <p>You will also receive an in-app notification about this request.</p>
        `,
      },
      patient_invitation: {
        subject: "New patient invitation",
        htmlContent: `
          <h2>New Patient Invitation</h2>
          <p>Hello {userName},</p>
          <p>You have received a new invitation to join as a patient on our healthcare platform.</p>
          <p><strong>Message:</strong> {message}</p>
          <p>Since you already have an account, you can:</p>
          <ul>
            <li><a href="{loginLink}">Log in to your account</a> to view the invitation</li>
            <li><a href="{dashboardLink}">Go to your dashboard</a> to manage your healthcare</li>
          </ul>
          <p>You will also receive an in-app notification about this invitation.</p>
        `,
      },
      collaboration_invitation: {
        subject: "New collaboration invitation",
        htmlContent: `
          <h2>New Collaboration Invitation</h2>
          <p>Hello {userName},</p>
          <p>You have received a new collaboration invitation on our healthcare platform.</p>
          <p><strong>Message:</strong> {message}</p>
          <p>Since you already have an account, you can:</p>
          <ul>
            <li><a href="{loginLink}">Log in to your account</a> to view the invitation</li>
            <li><a href="{dashboardLink}">Go to your dashboard</a> to manage collaborations</li>
          </ul>
          <p>You will also receive an in-app notification about this invitation.</p>
        `,
      }
    };
    return templates[invitationType] || templates.doctor_invitation;
  }
}

import { Injectable, UnauthorizedException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserActivityLogService } from '../admin/services/user-activity-log.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { EmailService } from '../email/email.service';
import { SmsService } from '../integrations/sms.service';
import * as bcrypt from 'bcrypt';
import { AuthResponse, UserProfileResponse } from '../types/api.types';
import { JwtUser } from '../types/request.types';
import { JsonObject } from 'type-fest';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { SystemConfigurationService } from '../admin/services/system-configuration.service';

interface RegisterWithVerificationResult {
  user: User;
  verificationEmailSent: boolean;
  verificationSmsSent?: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private userActivityLogService: UserActivityLogService,
    private tokenBlacklistService: TokenBlacklistService,
    private emailService: EmailService,
    private smsService: SmsService,
    private notificationsService: NotificationsService,
    private systemConfigService: SystemConfigurationService,
  ) { }

  async validateUser(email: string, pass: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (isMatch) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...result } = user;
        return result;
      }
    }
    return null;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const userEntity = await this.usersService.findByEmail(loginDto.email);

    if (!userEntity) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check Maintenance Mode
    const isMaintenanceMode = await this.systemConfigService.isMaintenanceModeEnabled();
    if (isMaintenanceMode && !userEntity.roles.includes('admin')) {
      throw new UnauthorizedException(
        'The platform is currently undergoing scheduled maintenance. Please try again later or contact support if you need urgent assistance.'
      );
    }

    // Check if account is locked
    if (userEntity.lockoutUntil && userEntity.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((userEntity.lockoutUntil.getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account is temporarily locked. Please try again in ${remainingMinutes} minutes.`);
    }

    const isMatch = await bcrypt.compare(loginDto.password, userEntity.password);

    if (!isMatch) {
      await this.usersService.incrementLoginAttempts(userEntity.id);

      // Log failed login attempt
      await this.userActivityLogService.logActivity({
        userId: userEntity.id,
        activityType: 'LOGIN_FAILED',
        activityDescription: 'Failed login attempt - invalid password',
        ipAddress,
        userAgent,
      });

      throw new UnauthorizedException('Invalid credentials');
    }

    // Ensure the user has verified their email before allowing login
    if (!userEntity.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in. Check your inbox for a verification code, or use "Resend verification email".'
      );
    }

    // Reset login attempts on successful login
    if (userEntity.loginAttempts > 0) {
      await this.usersService.resetLoginAttempts(userEntity.id);
    }

    const payload = {
      email: userEntity.email,
      sub: userEntity.id,
      roles: userEntity.roles
    };

    // Generate both access and refresh tokens
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Store refresh token in user record
    await this.usersService.update(userEntity.id, { refreshToken });

    // Log login activity asynchronously
    this.userActivityLogService.logActivity({
      userId: userEntity.id,
      activityType: 'login',
      activityDescription: 'User logged in',
      ipAddress,
      userAgent,
    }).catch(err => this.logger.warn(`Failed to log login activity: ${err.message}`));

    // Notify user about login (security notification)
    this.notificationsService.createNotification({
      userId: userEntity.id,
      title: 'New Login Detected',
      message: `A new login was detected on your account at ${new Date().toLocaleString()}. If this wasn't you, please change your password immediately.`,
      type: 'security_login',
      deliveryMethod: 'email', // Security alerts must go to email
    });

    const centerId = await this.usersService.getCenterIdForUser(userEntity.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: userEntity.id,
        email: userEntity.email,
        roles: userEntity.roles,
        displayId: userEntity.displayId,
      },
      profile: userEntity.profile || null,
      center_id: centerId || undefined,
    };
  }

  async register(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<User> {
    // Check if registration is enabled
    const isRegEnabled = await this.systemConfigService.isUserRegistrationEnabled();
    if (!isRegEnabled) {
      throw new BadRequestException('Public registration is currently disabled by the system administrator.');
    }

    // Check if an account already exists with this email
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      if (!existingUser.isEmailVerified) {
        // Delete the old unverified account so the user can start fresh
        this.logger.log(`Removing unverified account for ${registerDto.email} to allow re-registration`);
        await this.usersService.remove(existingUser.id);
      } else {
        // User exists and is verified
        this.logger.warn(`Attempted registration with existing verified email: ${registerDto.email}`);
        throw new BadRequestException('An account with this email already exists. Please log in instead.');
      }
    }

    const createUserDto = {
      email: registerDto.email,
      password: registerDto.password,
      roles: registerDto.roles,
      profile: {
        displayName: registerDto.name,
        firstName: registerDto.name?.trim().split(/\s+/)[0] || undefined,
        lastName: registerDto.name?.trim().split(/\s+/).slice(1).join(' ') || undefined,
        phone: registerDto.phone,
      },
    };
    const user = await this.usersService.create(createUserDto);

    // Log registration activity asynchronously
    this.userActivityLogService.logActivity({
      userId: user.id,
      activityType: 'registration',
      activityDescription: 'User registered',
      ipAddress,
      userAgent,
    }).catch(err => this.logger.warn(`Failed to log registration activity: ${err.message}`));

    // Notify user of successful registration
    await this.notificationsService.createNotification({
      userId: user.id,
      title: 'Welcome to Unlimited Healthcare',
      message: 'Your account has been created successfully. We are excited to have you on board!',
      type: 'account_created',
      deliveryMethod: 'email',
    });

    return user;
  }

  async registerWithVerification(registerDto: RegisterDto, ipAddress?: string, userAgent?: string): Promise<RegisterWithVerificationResult> {
    const user = await this.register(registerDto, ipAddress, userAgent);

    // Generate verification token
    const verificationToken = this.generateOtp();
    const verificationTokenExpiry = new Date(Date.now() + 30 * 60000); // 30 minutes

    // Save token once
    await this.usersService.saveVerificationToken(user.id, verificationToken, verificationTokenExpiry);

    // Send verification email
    let verificationEmailSent = false;
    try {
      verificationEmailSent = await this.emailService.sendVerificationEmail(
        user.email,
        verificationToken,
        registerDto.name?.split(' ')[0]
      );
      this.logger.log(`Verification email sent to ${user.email}: ${verificationEmailSent}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${user.email}: ${error.message}`);
    }

    // Also send SMS if phone is provided
    let verificationSmsSent = false;
    if (registerDto.phone) {
      try {
        await this.smsService.sendVerificationCode(registerDto.phone, verificationToken);
        verificationSmsSent = true;
        this.logger.log(`Verification SMS sent to ${registerDto.phone}`);
      } catch (error) {
        this.logger.error(`Failed to send verification SMS to ${registerDto.phone}: ${error.message}`);
      }
    }

    return { user, verificationEmailSent, verificationSmsSent };
  }

  async logout(userId: string, accessToken?: string, ipAddress?: string, userAgent?: string): Promise<void> {
    // Clear refresh token from user record
    await this.usersService.update(userId, { refreshToken: null });

    // Blacklist the access token if provided
    if (accessToken) {
      try {
        // Decode token to get expiration time
        const decoded = this.jwtService.decode(accessToken) as { exp?: number; sub?: string };
        if (decoded && decoded.exp) {
          // Calculate TTL in seconds (exp is in seconds, current time in milliseconds)
          const currentTime = Math.floor(Date.now() / 1000);
          const ttl = decoded.exp - currentTime;

          if (ttl > 0) {
            await this.tokenBlacklistService.blacklistToken(accessToken, ttl);
            this.logger.debug(`Access token blacklisted for user ${userId}`);
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to blacklist token during logout: ${error.message}`);
        // Don't throw error - logout should still succeed even if blacklisting fails
      }
    }

    // Log logout activity
    await this.userActivityLogService.logActivity({
      userId: userId,
      activityType: 'LOGOUT',
      activityDescription: 'User logged out',
      ipAddress,
      userAgent,
      metadata: { tokenBlacklisted: !!accessToken } as JsonObject,
    });

    // Notify user about logout (optional, but requested for "all actions")
    this.notificationsService.createNotification({
      userId: userId,
      type: 'system',
      title: 'Account Logout',
      message: `You have been logged out from your account. If this wasn't you, please change your password.`,
      data: { ipAddress, timestamp: new Date() }
    }).catch(err => this.logger.warn(`Failed to create logout notification: ${err.message}`));
  }

  async refreshToken(user: JwtUser): Promise<string> {
    const payload = { username: user.email, sub: user.userId };
    return this.jwtService.sign(payload);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthResponse> {
    // Validate refresh token logic here
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify the refresh token matches the stored one
    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles
    };

    // Generate new access and refresh tokens
    const newAccessToken = this.jwtService.sign(payload);
    const newRefreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Store new refresh token in user record
    await this.usersService.update(user.id, { refreshToken: newRefreshToken });

    return {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        displayId: user.displayId,
      },
    };
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const centerId = await this.usersService.getCenterIdForUser(userId);

    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      displayId: user.displayId,
      profile: user.profile,
      center_id: centerId || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: true,
    };
  }

  // Generate a secure random token
  private generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate a 6-digit OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Forgot Password - send reset email
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    // For development/debugging, we reveal existence.
    // In strict production mode, you might want to return generic success,
    // but the user has requested explicit notification.
    if (!user) {
      throw new NotFoundException(`Account with email ${email} not found.`);
    }

    // Check for rate limit (3 minutes)
    if (user.lastPasswordResetSentAt) {
      const diffInMinutes = (Date.now() - new Date(user.lastPasswordResetSentAt).getTime()) / 60000;
      if (diffInMinutes < 3) {
        throw new BadRequestException(`Please wait ${Math.ceil(3 - diffInMinutes)} more minutes before requesting another reset.`);
      }
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const resetTokenExpiry = new Date(Date.now() + 30 * 60000); // 30 minutes from now

    // Save token to user
    await this.usersService.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetTokenExpiry: resetTokenExpiry,
      lastPasswordResetSentAt: new Date(),
    });

    // Log the activity
    await this.userActivityLogService.logActivity({
      userId: user.id,
      activityType: 'PASSWORD_RESET_REQUEST',
      activityDescription: 'Password reset requested',
    });

    // In production, send email here
    // For now, log the token (remove in production)
    this.logger.log(`Password reset token for ${email}: ${resetToken}`);

    // Send email with reset link in the background to avoid blocking the response
    this.emailService.sendPasswordResetEmail(user.email, resetToken)
      .then(success => {
        if (success) {
          this.logger.log(`Password reset email sent successfully to ${user.email}`);
        } else {
          this.logger.warn(`Email service returned failure but did not throw for ${user.email}`);
        }
      })
      .catch(error => {
        this.logger.error(`Failed to send password reset email to ${user.email}: ${error.message}`);
      });

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  // Reset Password with token
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // Find user by reset token
    const user = await this.usersService.findByResetToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    // Check if token is expired
    if (user.passwordResetTokenExpiry < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    // Update password (UsersService.update handles hashing) and clear reset token
    await this.usersService.update(user.id, {
      password: newPassword,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    });

    // Log the activity
    await this.userActivityLogService.logActivity({
      userId: user.id,
      activityType: 'PASSWORD_RESET_SUCCESS',
      activityDescription: 'Password was successfully reset',
    });

    this.logger.log(`Password reset successful for user: ${user.email}`);

    // Notify user about password reset success
    this.notificationsService.createNotification({
      userId: user.id,
      type: 'system',
      title: 'Password Changed Successfully',
      message: 'Your account password has been changed recently. If you did not make this change, please contact support immediately.',
      data: { userId: user.id }
    }).catch(err => this.logger.warn(`Failed to create password reset notification: ${err.message}`));

    return { message: 'Password has been reset successfully. You can now log in with your new password.' };
  }

  // Verify Email with token
  async verifyEmail(token: string): Promise<AuthResponse & { message: string; profile: User['profile'] | null }> {
    // Find user by verification token
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (user.emailVerificationTokenExpiry < new Date()) {
      throw new UnauthorizedException('Verification token has expired');
    }

    // Mark email as verified and clear verification token
    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpiry: null,
    });

    const payload = {
      email: user.email,
      sub: user.id,
      roles: user.roles,
    };

    // Auto-issue a fresh session after successful verification for smoother onboarding.
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret',
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    await this.usersService.update(user.id, { refreshToken });

    // Log the activity
    await this.userActivityLogService.logActivity({
      userId: user.id,
      activityType: 'EMAIL_VERIFIED',
      activityDescription: 'Email address verified',
    });

    this.logger.log(`Email verified for user: ${user.email}`);

    return {
      message: 'Email has been verified successfully.',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
        displayId: user.displayId,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
      profile: user.profile || null,
    };
  }

  // Resend Verification
  async resendVerification(email: string, channel: 'email' | 'sms' | 'whatsapp' = 'email'): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(`Account with email ${email} not found.`);
    }

    if (user.isEmailVerified) {
      return { message: 'Email is already verified.' };
    }

    // Check for rate limit (3 minutes)
    if (user.lastVerificationSentAt) {
      const diffInMinutes = (Date.now() - new Date(user.lastVerificationSentAt).getTime()) / 60000;
      if (diffInMinutes < 1) { // Reduced rate limit for better UX during development
        throw new BadRequestException(`Please wait ${Math.ceil(1 - diffInMinutes)} more minutes before resending.`);
      }
    }

    // Generate/Refresh OTP — expires in 30 minutes
    const verificationToken = this.generateOtp();
    const verificationTokenExpiry = new Date(Date.now() + 30 * 60000);

    await this.usersService.saveVerificationToken(user.id, verificationToken, verificationTokenExpiry);

    let sent = false;
    let method = 'email';

    if (channel === 'sms' || channel === 'whatsapp') {
      const phone = user.profile?.phone;
      if (!phone) {
        throw new BadRequestException('No phone number associated with this account. Please use email verification.');
      }

      this.logger.log(`Triggering ${channel} verification for user ${email} to phone ${phone}`);

      if (channel === 'sms') {
        await this.smsService.sendVerificationCode(phone, verificationToken);
        method = 'SMS';
      } else {
        await this.smsService.sendWhatsappVerificationCode(phone, verificationToken);
        method = 'WhatsApp';
      }
      sent = true;
    } else {
      this.logger.log(`Triggering email verification for user ${email}`);
      sent = await this.emailService.sendVerificationEmail(user.email, verificationToken, user.profile?.firstName);
      method = 'email';
    }

    this.logger.log(`Verification code (${verificationToken}) sent via ${method} to ${user.email}`);

    return {
      message: sent
        ? `Verification code sent successfully via ${method}.`
        : `Failed to send verification code via ${method}. Please try another method.`
    };
  }

  // Send an existing verification email using a provided token
  async sendExistingVerificationEmail(userId: string, token: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) return false;

    try {
      const firstName = user.profile?.firstName;
      return await this.emailService.sendVerificationEmail(user.email, token, firstName);
    } catch (error) {
      this.logger.error(`Failed to send existing verification email: ${error.message}`);
      return false;
    }
  }

  // Send verification email on registration
  async sendVerificationEmail(userId: string): Promise<boolean> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return false;
    }

    const verificationToken = this.generateOtp();
    const verificationTokenExpiry = new Date(Date.now() + 30 * 60000); // 30 minutes

    // Use dedicated method that writes via QueryBuilder to guarantee column mapping
    await this.usersService.saveVerificationToken(user.id, verificationToken, verificationTokenExpiry);

    // In production, send email here
    this.logger.log(`Verification token for ${user.email}: ${verificationToken}`);

    try {
      const firstName = user.profile?.firstName;
      const emailSent = await this.emailService.sendVerificationEmail(user.email, verificationToken, firstName);

      // Also send SMS if phone is available
      if (user.profile?.phone) {
        await this.smsService.sendVerificationCode(user.profile.phone, verificationToken)
          .catch(err => this.logger.error(`Failed to send verification SMS: ${err.message}`));
      }

      if (!emailSent) {
        this.logger.warn(`Verification email could not be delivered to ${user.email}`);
      }
      return emailSent;
    } catch (error) {
      this.logger.error(`Failed to send verification notification: ${error.message}`);
      return false;
    }
  }
}

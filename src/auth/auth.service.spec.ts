import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserActivityLogService } from '../admin/services/user-activity-log.service';
import { TokenBlacklistService } from './services/token-blacklist.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../email/email.service';
import { SmsService } from '../integrations/sms.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    incrementLoginAttempts: jest.fn(),
    resetLoginAttempts: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
    decode: jest.fn(),
  };

  const mockUserActivityLogService = {
    logActivity: jest.fn(),
  };

  const mockTokenBlacklistService = {
    blacklistToken: jest.fn(),
    isTokenBlacklisted: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  };

  const mockSmsService = {
    sendVerificationCode: jest.fn(),
    sendWhatsappVerificationCode: jest.fn(),
  };


  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserActivityLogService,
          useValue: mockUserActivityLogService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockTokenBlacklistService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        roles: ['patient'],
      };

      const createdUser = {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        roles: ['patient'],
      };

      mockUsersService.create.mockResolvedValue(createdUser);
      mockUserActivityLogService.logActivity.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      const createUserDto = {
        email: registerDto.email,
        password: registerDto.password,
        roles: registerDto.roles,
        profile: {
          displayName: registerDto.name,
          firstName: 'Test',
          lastName: 'User',
          phone: undefined,
        },
      };

      expect(result).toEqual(createdUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(mockUserActivityLogService.logActivity).toHaveBeenCalledWith({
        userId: '1',
        activityType: 'registration',
        activityDescription: 'User registered',
        ipAddress: undefined,
        userAgent: undefined,
      });
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        roles: ['patient'],
      };

      const createUserDto = {
        email: registerDto.email,
        password: registerDto.password,
        roles: registerDto.roles,
        profile: {
          displayName: registerDto.name,
          firstName: 'Existing',
          lastName: 'User',
          phone: undefined,
        },
      };

      mockUsersService.create.mockRejectedValue(new ConflictException('User already exists'));

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        roles: ['patient'],
        displayId: 'DISP001',
        isEmailVerified: true,
      };

      mockUsersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('accessToken');
      mockUserActivityLogService.logActivity.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
      expect(result.user.id).toBe('1');
      expect(result.access_token).toBe('accessToken');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockUserActivityLogService.logActivity).toHaveBeenCalledWith({
        userId: '1',
        activityType: 'login',
        activityDescription: 'User logged in',
        ipAddress: undefined,
        userAgent: undefined,
      });
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        isEmailVerified: true,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });
});

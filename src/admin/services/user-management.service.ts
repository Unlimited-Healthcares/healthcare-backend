import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserManagement, AccountStatus } from '../entities/user-management.entity';
import { User } from '../../users/entities/user.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { Appointment } from '../../appointments/entities/appointment.entity';
import { CenterVerificationRequest, VerificationStatus } from '../entities/center-verification-request.entity';
import { Payment, PaymentStatus } from '../../integrations/entities/payment.entity';
import { CreateUserManagementDto, UpdateUserManagementDto, UserManagementFiltersDto, BulkUserActionDto } from '../dto/user-management.dto';
import { AdminAuditLogService } from './admin-audit-log.service';
import { UserActivityLogService } from './user-activity-log.service';
import { UsersService } from '../../users/users.service';
import { JsonObject } from '../../types/common';

export interface TransformedUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  isActive: boolean;
  kycStatus: string;
  isSuspended: boolean;
  isBanned: boolean;
  suspendedUntil: string;
  createdAt: Date;
  lastLogin: Date;
}

@Injectable()
export class UserManagementService {
  constructor(
    @InjectRepository(UserManagement)
    private userManagementRepository: Repository<UserManagement>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(HealthcareCenter)
    private centerRepository: Repository<HealthcareCenter>,
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(CenterVerificationRequest)
    private verificationRepository: Repository<CenterVerificationRequest>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private auditLogService: AdminAuditLogService,
    private activityLogService: UserActivityLogService,
    private usersService: UsersService,
  ) { }

  async createUserManagement(
    createDto: CreateUserManagementDto,
    managedBy: string,
  ): Promise<UserManagement> {
    const userManagement = this.userManagementRepository.create({
      ...createDto,
      managedBy,
    });

    const savedUserManagement = await this.userManagementRepository.save(userManagement);

    await this.auditLogService.logAction({
      adminUserId: managedBy,
      actionType: 'user_management_created',
      targetType: 'user',
      targetId: createDto.userId,
      actionDescription: `Created user management for user ${createDto.userId}`,
      newValues: JSON.parse(JSON.stringify(userManagement)),
    });

    return savedUserManagement;
  }

  async provisionUser(
    userData: {
      name: string;
      email: string;
      role: string;
      password?: string;
      phone?: string;
    },
    managedBy: string,
  ): Promise<User> {
    const password = userData.password || Math.random().toString(36).slice(-10);

    // Create the core user via UsersService
    const user = await this.usersService.create({
      email: userData.email,
      password: password,
      roles: [userData.role],
      profile: {
        displayName: userData.name,
        firstName: userData.name.split(' ')[0],
        lastName: userData.name.split(' ').slice(1).join(' '),
        phone: userData.phone,
      }
    });

    // Mark as pre-verified
    user.isEmailVerified = true;
    user.isActive = true;
    await this.usersRepository.save(user);

    // Initialize management record
    await this.createUserManagement({
      userId: user.id,
      accountStatus: AccountStatus.ACTIVE,
      notes: `Provisioned by administrator ${managedBy}`,
    }, managedBy);

    await this.auditLogService.logAction({
      adminUserId: managedBy,
      actionType: 'user_provisioned',
      targetType: 'user',
      targetId: user.id,
      actionDescription: `Provisioned new user account: ${userData.email} with role ${userData.role}`,
      newValues: {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        name: userData.name
      }
    });

    return user;
  }

  async getUserManagement(filters: UserManagementFiltersDto): Promise<{
    users: TransformedUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, accountStatus, search, role } = filters;

    // Base query on User entity to ensure we see all users
    const queryBuilder = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user_management', 'um', 'um.user_id::uuid = user.id')
      .select([
        'user.id',
        'user.email',
        'user.roles',
        'user.isActive',
        'user.kycStatus',
        'user.createdAt',
        'profile.firstName',
        'profile.lastName',
        'profile.displayName',
        'um.account_status',
        'um.suspended_until',
        'um.last_login'
      ]);

    if (accountStatus) {
      queryBuilder.andWhere('um.account_status = :accountStatus', { accountStatus });
    }

    if (role) {
      const roleList = role.split(',');
      if (roleList.length === 1) {
        queryBuilder.andWhere('user.roles LIKE :role', { role: `%${roleList[0]}%` });
      } else {
        const roleConditions = roleList.map((_, i) => `user.roles LIKE :role${i}`).join(' OR ');
        const roleParams = roleList.reduce((acc, r, i) => ({ ...acc, [`role${i}`]: `%${r}%` }), {});
        queryBuilder.andWhere(`(${roleConditions})`, roleParams);
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(profile.firstName ILIKE :search OR profile.lastName ILIKE :search OR profile.displayName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    // Mapping to frontend expected format
    const transformedUsers = users.map(user => {
      const um = (user as any).um || {};
      return {
        id: user.id,
        name: user.profile ? (user.profile.displayName || `${user.profile.firstName} ${user.profile.lastName}`) : 'Unknown',
        email: user.email,
        roles: user.roles,
        isActive: user.isActive,
        kycStatus: user.kycStatus,
        isSuspended: um.account_status === AccountStatus.SUSPENDED,
        isBanned: um.account_status === AccountStatus.BANNED,
        suspendedUntil: um.suspended_until,
        createdAt: user.createdAt,
        lastLogin: um.last_login
      };
    });

    return {
      users: transformedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserManagementByUserId(userId: string): Promise<UserManagement> {
    let userManagement = await this.userManagementRepository.findOne({ where: { userId } });

    if (!userManagement) {
      // Create default user management record if it doesn't exist
      userManagement = await this.userManagementRepository.save({
        userId,
        accountStatus: AccountStatus.ACTIVE,
      });
    }

    return userManagement;
  }

  async updateUserManagement(
    userId: string,
    updateDto: UpdateUserManagementDto,
    managedBy: string,
  ): Promise<UserManagement> {
    const userManagement = await this.getUserManagementByUserId(userId);
    const oldValues = { ...userManagement };

    Object.assign(userManagement, updateDto);
    userManagement.managedBy = managedBy;

    const updatedUserManagement = await this.userManagementRepository.save(userManagement);

    await this.auditLogService.logAction({
      adminUserId: managedBy,
      actionType: 'user_management_updated',
      targetType: 'user',
      targetId: userId,
      actionDescription: `Updated user management for user ${userId}`,
      oldValues: JSON.parse(JSON.stringify(oldValues)),
      newValues: JSON.parse(JSON.stringify(updatedUserManagement)),
    });

    return updatedUserManagement;
  }

  async suspendUser(
    userId: string,
    suspendedUntil: Date,
    suspensionReason: string,
    managedBy: string,
  ): Promise<UserManagement> {
    return this.updateUserManagement(
      userId,
      {
        accountStatus: AccountStatus.SUSPENDED,
        suspendedUntil: suspendedUntil.toISOString(),
        suspensionReason,
      },
      managedBy
    );
  }

  async activateUser(userId: string, managedBy: string): Promise<UserManagement> {
    return this.updateUserManagement(
      userId,
      {
        accountStatus: AccountStatus.ACTIVE,
        suspendedUntil: undefined,
        suspensionReason: undefined,
      },
      managedBy
    );
  }

  async deleteUser(userId: string, managedBy: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;

    // Log the action first while we still have user data
    await this.auditLogService.logAction({
      adminUserId: managedBy,
      actionType: 'user_deleted',
      targetType: 'user',
      targetId: userId,
      actionDescription: `Permanently deleted user account: ${user.email}`,
      oldValues: {
        userId: user.id,
        email: user.email,
        roles: user.roles
      }
    });

    // Delete related management record first (foreign key constraint might apply)
    await this.userManagementRepository.delete({ userId });

    // Delete the user
    await this.usersRepository.delete(userId);
  }

  async banUser(userId: string, reason: string, managedBy: string): Promise<UserManagement> {
    return this.updateUserManagement(
      userId,
      {
        accountStatus: AccountStatus.BANNED,
        suspensionReason: reason,
      },
      managedBy
    );
  }

  async bulkUserAction(
    bulkActionDto: BulkUserActionDto,
    managedBy: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = { success: 0, failed: 0, errors: [] };

    for (const userId of bulkActionDto.userIds) {
      try {
        switch (bulkActionDto.action) {
          case 'suspend': {
            const suspendedUntil = bulkActionDto.suspendedUntil ? new Date(bulkActionDto.suspendedUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
            await this.suspendUser(userId, suspendedUntil, bulkActionDto.reason || 'Bulk suspension', managedBy);
            break;
          }
          case 'activate':
            await this.activateUser(userId, managedBy);
            break;
          case 'ban':
            await this.banUser(userId, bulkActionDto.reason || 'Bulk ban', managedBy);
            break;
          default:
            throw new Error(`Unknown action: ${bulkActionDto.action}`);
        }
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`User ${userId}: ${error.message}`);
      }
    }

    await this.auditLogService.logAction({
      adminUserId: managedBy,
      actionType: 'bulk_user_action',
      targetType: 'user',
      actionDescription: `Performed bulk action '${bulkActionDto.action}' on ${bulkActionDto.userIds.length} users`,
      metadata: { action: bulkActionDto.action, userIds: bulkActionDto.userIds, results },
    });

    return results;
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    suspended: number;
    banned: number;
  }> {
    const totalUsers = await this.userManagementRepository.count();
    const activeUsers = await this.userManagementRepository.count({ where: { accountStatus: AccountStatus.ACTIVE } });
    const suspendedUsers = await this.userManagementRepository.count({ where: { accountStatus: AccountStatus.SUSPENDED } });
    const bannedUsers = await this.userManagementRepository.count({ where: { accountStatus: AccountStatus.BANNED } });

    return {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      banned: bannedUsers,
    };
  }

  async getDashboardSummary(): Promise<JsonObject> {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
    const totalCenters = await this.centerRepository.count();
    const pendingVerifications = await this.verificationRepository.count({ where: { status: VerificationStatus.PENDING } });

    // Last 30 days real payment trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const payments = await this.paymentRepository.createQueryBuilder('payment')
      .select("DATE_TRUNC('day', payment.createdAt)", 'date')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .andWhere('payment.status = :status', { status: PaymentStatus.SUCCEEDED })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    const revenueData = payments.map(p => ({
      name: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: parseFloat(p.total || '0'),
    }));

    // Center type distribution
    const centerTypes = await this.centerRepository.createQueryBuilder('center')
      .select('center.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('center.type')
      .getRawMany();

    const centerTypeData = centerTypes.map((c, i) => ({
      name: c.type.charAt(0).toUpperCase() + c.type.slice(1),
      value: parseInt(c.count),
      color: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][i % 5],
    }));

    // Appointment stats
    const appointmentStats = await this.appointmentRepository.createQueryBuilder('appt')
      .select('appt.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appt.status')
      .getRawMany();

    const appointmentData = [
      {
        name: 'Recent',
        completed: parseInt(appointmentStats.find(s => s.status === 'completed')?.count || '0'),
        cancelled: parseInt(appointmentStats.find(s => s.status === 'cancelled')?.count || '0'),
        scheduled: parseInt(appointmentStats.find(s => s.status === 'scheduled')?.count || '0'),
      }
    ];

    return {
      stats: {
        totalUsers,
        activeUsers,
        totalCenters,
        pendingVerifications,
        growth: 5.2, // Mocked growth percentage for UX
      },
      charts: {
        revenueData,
        centerTypeData,
        appointmentData,
      }
    };
  }

  async getUserAnalytics(_filters: JsonObject): Promise<JsonObject> {
    // Get user registration trends
    const registrationTrends = await this.userManagementRepository
      .createQueryBuilder('um')
      .select('DATE(um.createdAt) as date, COUNT(*) as count')
      .groupBy('DATE(um.createdAt)')
      .orderBy('date', 'DESC')
      .limit(30)
      .getRawMany();

    return {
      registrationTrends,
      totalUsers: await this.userManagementRepository.count(),
      activeUsers: await this.userManagementRepository.count({
        where: { accountStatus: AccountStatus.ACTIVE }
      }),
    };
  }

  private async generateUserReport(userId: string, reportType: string): Promise<JsonObject> {
    const userManagement = await this.getUserManagementByUserId(userId);

    return {
      userId,
      reportType,
      generatedAt: new Date().toISOString(),
      accountStatus: userManagement.accountStatus,
      lastLogin: userManagement.lastLogin?.toISOString(),
      loginCount: userManagement.loginCount,
    };
  }
}

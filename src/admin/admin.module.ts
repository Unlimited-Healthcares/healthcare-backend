
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Entities
import { CenterVerificationRequest } from './entities/center-verification-request.entity';
import { SystemConfiguration } from './entities/system-configuration.entity';
import { UserActivityLog } from './entities/user-activity-log.entity';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { CenterPerformanceMetrics } from './entities/center-performance-metrics.entity';
import { UserManagement } from './entities/user-management.entity';
import { AdminRegistrationRequest } from './entities/admin-registration-request.entity';
import { Profile } from '../users/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Payment } from '../integrations/entities/payment.entity';
import { WalletTransaction } from '../wallets/entities/wallet-transaction.entity';
import { Wallet } from '../wallets/entities/wallet.entity';

// Services
import { CenterVerificationService } from './services/center-verification.service';
import { SystemConfigurationService } from './services/system-configuration.service';
import { UserActivityLogService } from './services/user-activity-log.service';
import { AdminAuditLogService } from './services/admin-audit-log.service';
import { UserManagementService } from './services/user-management.service';
import { AdminRegistrationService } from './services/admin-registration.service';
import { FinanceManagementService } from './services/finance-mgmt.service';

// Controllers
import { AdminCenterController } from './controllers/admin-center.controller';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminSystemController } from './controllers/admin-system.controller';
import { AdminRegistrationController } from './controllers/admin-registration.controller';

// External modules
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CenterVerificationRequest,
      SystemConfiguration,
      UserActivityLog,
      AdminAuditLog,
      CenterPerformanceMetrics,
      UserManagement,
      AdminRegistrationRequest,
      Profile,
      User,
      HealthcareCenter,
      Appointment,
      Payment,
      WalletTransaction,
      Wallet,
    ]),
    UsersModule,
    AuditModule,
  ],
  controllers: [
    AdminCenterController,
    AdminUsersController,
    AdminSystemController,
    AdminRegistrationController,
  ],
  providers: [
    CenterVerificationService,
    SystemConfigurationService,
    UserActivityLogService,
    AdminAuditLogService,
    UserManagementService,
    AdminRegistrationService,
    FinanceManagementService,
  ],
  exports: [
    CenterVerificationService,
    SystemConfigurationService,
    UserActivityLogService,
    AdminAuditLogService,
    UserManagementService,
    AdminRegistrationService,
    FinanceManagementService,
  ],
})
export class AdminModule { }

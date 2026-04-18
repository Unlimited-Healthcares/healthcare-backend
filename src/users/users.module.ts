
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { KycService } from './kyc.service';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { UserSettings } from './entities/user-settings.entity';
import { KycSubmission } from './entities/kyc-submission.entity';
import { CenterStaff } from '../centers/entities/center-staff.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { IdGeneratorService } from './services/id-generator.service';
import { UserSettingsService } from './services/user-settings.service';
import { LicenseExpiryCronService } from './license-expiry-cron.service';
import { PatientsModule } from '../patients/patients.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadsModule } from '../uploads/uploads.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile, UserSettings, KycSubmission, CenterStaff, HealthcareCenter]),
    MulterModule.register({
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    }),
    PatientsModule,
    NotificationsModule,
    UploadsModule,
    SupabaseModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, KycService, IdGeneratorService, UserSettingsService, LicenseExpiryCronService],
  exports: [UsersService, KycService, IdGeneratorService, UserSettingsService],
})
export class UsersModule { }

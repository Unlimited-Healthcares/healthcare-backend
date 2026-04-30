import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OtaController } from './ota/ota.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PatientsModule } from './patients/patients.module';
import { CentersModule } from './centers/centers.module';
import { MedicalRecordsModule } from './medical-records/medical-records.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { MedicalReportsModule } from './medical-reports/medical-reports.module';
import { NotificationsModule } from './notifications/notifications.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { AuditModule } from './audit/audit.module';

// New modules for Phase 6
import { CacheModule } from './cache/cache.module';
import { SecurityModule } from './security/security.module';
import { ComplianceModule } from './compliance/compliance.module';

// New modules for Phase 8
import { LocationModule } from './location/location.module';

// New modules for Phase 9
import { ReviewsModule } from './reviews/reviews.module';

// New modules for Phase 10
import { EmergencyModule } from './emergency/emergency.module';

// New modules for Phase 11

import { AdminModule } from './admin/admin.module';

import { BloodDonationModule } from './blood-donation/blood-donation.module';

import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { ValidationPipe } from './pipes/validation.pipe';


// New modules for Phase 14b
import { ChatModule } from './chat/chat.module';
import { VideoConferencingModule } from './video-conferencing/video-conferencing.module';

// Discovery system modules
import { RequestsModule } from './requests/requests.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ImagingModule } from './imaging/imaging.module';
import { CareTasksModule } from './care-tasks/care-tasks.module';
import { UploadsModule } from './uploads/uploads.module';
import { WalletsModule } from './wallets/wallets.module';
import { CommunityModule } from './community/community.module';
import { SupportModule } from './support/support.module';
import { AiModule } from './ai/ai.module';
import { MedicalVolunteerModule } from './medical-volunteer/medical-volunteer.module';
import { SearchModule } from './search/search.module';
import { MortuaryModule } from './mortuary/mortuary.module';
import { ClinicalWorkflowModule } from './clinical/clinical-workflow.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BiotechModule } from './biotech/biotech.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';

@Module({
  imports: [
    BiotechModule,
    PharmacyModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/ota-staging', // Download will be at /ota-staging/dist.zip
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.production', '.env.development', '.env'],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT) || 5432,
      username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || process.env.DB_NAME || 'healthcare',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto-sync schema with entities
      ssl: process.env.NODE_ENV === 'production' || process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: false }
        : false,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    HealthModule,
    PatientsModule,
    CentersModule,
    MedicalRecordsModule,
    AppointmentsModule,
    ReferralsModule,
    MedicalReportsModule,
    NotificationsModule,
    IntegrationsModule,
    AuditModule,
    // Phase 6 modules
    CacheModule,
    SecurityModule,
    ComplianceModule,
    // Phase 8 modules
    LocationModule,
    // Phase 9 modules
    ReviewsModule,
    // Phase 10 modules
    EmergencyModule,
    AdminModule,
    BloodDonationModule,
    // Phase 14b modules
    ChatModule,
    VideoConferencingModule,
    // Discovery system modules
    RequestsModule,
    InvitationsModule,
    ImagingModule,
    CareTasksModule,
    UploadsModule,
    WalletsModule,
    CommunityModule,
    SupportModule,
    AiModule,
    MedicalVolunteerModule,
    SearchModule,
    MortuaryModule,
    ClinicalWorkflowModule,
  ],
  controllers: [
    AppController,
    OtaController,
  ],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule { }

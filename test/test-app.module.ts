import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { UsersModule } from '../src/users/users.module';
import { AuthModule } from '../src/auth/auth.module';
import { HealthModule } from '../src/health/health.module';
import { PatientsModule } from '../src/patients/patients.module';
import { CentersModule } from '../src/centers/centers.module';
import { AppointmentsModule } from '../src/appointments/appointments.module';
import { NotificationsModule } from '../src/notifications/notifications.module';
import { AuditModule } from '../src/audit/audit.module';
import { ChatModule } from '../src/chat/chat.module';

// Import actual modules for testing
import { MedicalRecordsModule } from '../src/medical-records/medical-records.module';
import { ReferralsModule } from '../src/referrals/referrals.module';

import { GlobalExceptionFilter } from '../src/filters/global-exception.filter';
import { LoggingInterceptor } from '../src/interceptors/logging.interceptor';
import { ValidationPipe } from '../src/pipes/validation.pipe';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.test',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT) || 5432,
      username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
      password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || process.env.DB_NAME || 'healthcare_test',
      entities: [__dirname + '/../src/**/*.entity{.ts,.js}'],
      synchronize: true, // Enable sync for tests to create tables
      dropSchema: true, // Drop and recreate schema for clean tests
      ssl: false,
      logging: false, // Disable logging in tests
    }),
    UsersModule,
    AuthModule,
    HealthModule,
    PatientsModule,
    CentersModule,
    MedicalRecordsModule, // Use actual medical records module
    AppointmentsModule,
    ReferralsModule, // Use actual referrals module
    NotificationsModule,
    AuditModule,
    ChatModule, // Add chat module for chat tests
  ],
  controllers: [AppController],
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
export class TestAppModule {} 
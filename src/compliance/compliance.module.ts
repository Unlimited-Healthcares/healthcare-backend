import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { DataRetentionService } from './data-retention.service';
import { ComplianceController } from './compliance.controller';
import { AuditModule } from '../audit/audit.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GdprModule } from './gdpr/gdpr.module';
import { HipaaModule } from './hipaa/hipaa.module';
import { ConsentRecord } from './entities/consent-record.entity';
import { DataDeletionRequest } from './entities/data-deletion-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConsentRecord, DataDeletionRequest]),
    AuditModule,
    ScheduleModule.forRoot(),
    GdprModule,
    HipaaModule,
  ],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    DataRetentionService,
  ],
  exports: [
    ComplianceService,
    DataRetentionService,
  ],
})
export class ComplianceModule {} 
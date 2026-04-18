import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditLog } from './entities/audit-log.entity';

import { AuditInterceptor } from './interceptors/audit.interceptor';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditLogService, AuditService, AuditInterceptor, Reflector],
  exports: [AuditLogService, AuditService, AuditInterceptor],
})
export class AuditModule {}

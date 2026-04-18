import { Module } from '@nestjs/common';
import { GdprService } from './gdpr.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [GdprService],
  exports: [GdprService],
})
export class GdprModule {} 
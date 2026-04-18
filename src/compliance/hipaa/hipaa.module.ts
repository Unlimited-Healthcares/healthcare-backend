import { Module } from '@nestjs/common';
import { HipaaService } from './hipaa.service';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [AuditModule],
  providers: [HipaaService],
  exports: [HipaaService],
})
export class HipaaModule {} 
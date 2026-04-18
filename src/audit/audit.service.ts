import { Injectable } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class AuditService {
  constructor(private readonly auditLogService: AuditLogService) {}

  async logActivity(
    userId: string,
    entityType: string,
    action: string,
    description: string,
    details?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.auditLogService.log({
      userId,
      entityType,
      action,
      entityId: null,
      details: {
        description,
        ...details,
      },
      ipAddress,
      userAgent,
    });
  }
} 
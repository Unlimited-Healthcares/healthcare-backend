import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

export interface AuditLogEntry {
  action: string;
  entityType: string;
  entityId: string | null;
  userId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(entry: AuditLogEntry): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...entry,
      timestamp: new Date(),
    });

    return await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    filters: {
      userId?: string;
      entityType?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
    },
    page: number = 1,
    limit: number = 50,
  ) {
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }
    if (filters.entityType) {
      queryBuilder.andWhere('audit.entityType = :entityType', { entityType: filters.entityType });
    }
    if (filters.action) {
      queryBuilder.andWhere('audit.action = :action', { action: filters.action });
    }
    if (filters.startDate) {
      queryBuilder.andWhere('audit.timestamp >= :startDate', { startDate: filters.startDate });
    }
    if (filters.endDate) {
      queryBuilder.andWhere('audit.timestamp <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder
      .orderBy('audit.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

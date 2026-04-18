import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminAuditLog } from '../entities/admin-audit-log.entity';
import { JsonObject } from '../../types/common';

export interface AdminAuditLogEntry {
  adminUserId: string;
  actionType: string;
  targetType?: string;
  targetId?: string;
  actionDescription: string;
  oldValues?: JsonObject;
  newValues?: JsonObject;
  ipAddress?: string;
  userAgent?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: JsonObject;
}

@Injectable()
export class AdminAuditLogService {
  constructor(
    @InjectRepository(AdminAuditLog)
    private auditLogRepository: Repository<AdminAuditLog>,
  ) {}

  async logAction(entry: AdminAuditLogEntry): Promise<AdminAuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...entry,
      success: entry.success !== false,
    });

    return await this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(filters: {
    adminUserId?: string;
    actionType?: string;
    targetType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AdminAuditLog[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 50, ...filterOptions } = filters;
    
    const queryBuilder = this.auditLogRepository.createQueryBuilder('audit');

    if (filterOptions.adminUserId) {
      queryBuilder.andWhere('audit.adminUserId = :adminUserId', { adminUserId: filterOptions.adminUserId });
    }
    if (filterOptions.actionType) {
      queryBuilder.andWhere('audit.actionType = :actionType', { actionType: filterOptions.actionType });
    }
    if (filterOptions.targetType) {
      queryBuilder.andWhere('audit.targetType = :targetType', { targetType: filterOptions.targetType });
    }
    if (filterOptions.startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate: filterOptions.startDate });
    }
    if (filterOptions.endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate: filterOptions.endDate });
    }

    queryBuilder
      .orderBy('audit.createdAt', 'DESC')
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

  async logAdminAction(
    adminUserId: string,
    actionType: string,
    targetType: string,
    targetId: string,
    actionDescription: string,
    oldValues?: JsonObject,
    newValues?: JsonObject,
    ipAddress?: string,
    userAgent?: string,
    metadata: JsonObject = {}
  ): Promise<AdminAuditLog> {
    const auditData: JsonObject = {
      adminUserId,
      actionType,
      targetType,
      targetId,
      actionDescription,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      metadata,
      success: true,
    };

    const auditLog = this.auditLogRepository.create(auditData);

    return await this.auditLogRepository.save(auditLog);
  }
}

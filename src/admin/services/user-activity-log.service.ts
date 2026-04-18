import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { UserActivityLog } from '../entities/user-activity-log.entity';
import { PaginatedApiResponse } from '../../types/api.types';
import { JsonObject } from '../../types/common';

export interface UserActivityEntry {
  userId: string;
  activityType: string;
  activityDescription?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  metadata?: JsonObject;
}

export interface ActivityStatsResponse {
  totalActivities: number;
  topActivities: {
    activityType: string;
    count: string;
  }[];
  timeRange: string;
}

@Injectable()
export class UserActivityLogService {
  constructor(
    @InjectRepository(UserActivityLog)
    private activityLogRepository: Repository<UserActivityLog>,
  ) {}

  async logActivity(entry: UserActivityEntry): Promise<UserActivityLog> {
    const activityLog = this.activityLogRepository.create(entry);
    return await this.activityLogRepository.save(activityLog);
  }

  async getUserActivities(
    userId: string,
    filters: {
      activityType?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<PaginatedApiResponse<UserActivityLog>> {
    const { page = 1, limit = 50, ...filterOptions } = filters;
    
    const queryBuilder = this.activityLogRepository.createQueryBuilder('activity');
    queryBuilder.where('activity.userId = :userId', { userId });

    if (filterOptions.activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType: filterOptions.activityType });
    }
    if (filterOptions.startDate) {
      queryBuilder.andWhere('activity.createdAt >= :startDate', { startDate: filterOptions.startDate });
    }
    if (filterOptions.endDate) {
      queryBuilder.andWhere('activity.createdAt <= :endDate', { endDate: filterOptions.endDate });
    }

    queryBuilder
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getAllActivities(filters: {
    activityType?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  } = {}): Promise<PaginatedApiResponse<UserActivityLog>> {
    const { page = 1, limit = 50, ...filterOptions } = filters;
    
    const queryBuilder = this.activityLogRepository.createQueryBuilder('activity');

    if (filterOptions.activityType) {
      queryBuilder.andWhere('activity.activityType = :activityType', { activityType: filterOptions.activityType });
    }
    if (filterOptions.startDate) {
      queryBuilder.andWhere('activity.createdAt >= :startDate', { startDate: filterOptions.startDate });
    }
    if (filterOptions.endDate) {
      queryBuilder.andWhere('activity.createdAt <= :endDate', { endDate: filterOptions.endDate });
    }

    queryBuilder
      .orderBy('activity.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [activities, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      data: activities,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getActivityStats(timeRange: 'day' | 'week' | 'month' = 'day'): Promise<ActivityStatsResponse> {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    const totalActivities = await this.activityLogRepository.count({
      where: {
        createdAt: MoreThanOrEqual(startDate),
      },
    });

    const topActivities = await this.activityLogRepository
      .createQueryBuilder('activity')
      .select('activity.activityType', 'activityType')
      .addSelect('COUNT(*)', 'count')
      .where('activity.createdAt >= :startDate', { startDate })
      .groupBy('activity.activityType')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      totalActivities,
      topActivities,
      timeRange,
    };
  }
}


import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogService } from './audit-log.service';

@ApiTags('analytics/audit-logs')
@Controller('analytics/audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get audit logs with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50)' })
  async getAuditLogs(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    const filters = {
      userId,
      entityType,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return await this.auditLogService.getAuditLogs(filters, page, limit);
  }
}

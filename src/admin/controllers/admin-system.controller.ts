import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { SystemConfigurationService } from '../services/system-configuration.service';
import { AdminAuditLogService } from '../services/admin-audit-log.service';
import { FinanceManagementService } from '../services/finance-mgmt.service';
import { CreateSystemConfigurationDto, UpdateSystemConfigurationDto, SystemConfigurationFiltersDto } from '../dto/system-configuration.dto';
import { ConfigType } from '../entities/system-configuration.entity';
import { AuthenticatedRequest } from '../../types/request.types';

@ApiTags('admin/system')
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AdminSystemController {
  constructor(
    private readonly systemConfigurationService: SystemConfigurationService,
    private readonly adminAuditLogService: AdminAuditLogService,
    private readonly financeManagementService: FinanceManagementService,
  ) { }

  @Post('configurations')
  @ApiOperation({ summary: 'Create system configuration' })
  @ApiResponse({ status: 201, description: 'Configuration created successfully' })
  @Roles('admin')
  async createConfiguration(
    @Body() createDto: CreateSystemConfigurationDto,
    @Request() req: AuthenticatedRequest
  ) {
    const config = await this.systemConfigurationService.createConfiguration(
      createDto,
      req.user.id
    );

    return {
      success: true,
      data: config,
      message: 'System configuration created successfully',
    };
  }

  @Get('configurations')
  @ApiOperation({ summary: 'Get system configurations' })
  @ApiResponse({ status: 200, description: 'Configurations retrieved successfully' })
  @Roles('admin')
  async getConfigurations(@Query() filters: SystemConfigurationFiltersDto) {
    const configurations = await this.systemConfigurationService.getConfigurations(filters);

    return {
      success: true,
      data: configurations,
    };
  }

  @Get('configurations/:configKey')
  @ApiOperation({ summary: 'Get configuration by key' })
  @ApiResponse({ status: 200, description: 'Configuration retrieved successfully' })
  @Roles('admin')
  async getConfigurationByKey(@Param('configKey') configKey: string) {
    const config = await this.systemConfigurationService.getConfigurationByKey(configKey);

    return {
      success: true,
      data: config,
    };
  }

  @Put('configurations/:configKey')
  @ApiOperation({ summary: 'Update system configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @Roles('admin')
  async updateConfiguration(
    @Param('configKey') configKey: string,
    @Body() updateDto: UpdateSystemConfigurationDto,
    @Request() req: AuthenticatedRequest
  ) {
    const config = await this.systemConfigurationService.updateConfiguration(
      configKey,
      updateDto,
      req.user.id
    );

    return {
      success: true,
      data: config,
      message: 'System configuration updated successfully',
    };
  }

  @Delete('configurations/:configKey')
  @ApiOperation({ summary: 'Delete system configuration' })
  @ApiResponse({ status: 200, description: 'Configuration deleted successfully' })
  @Roles('admin')
  async deleteConfiguration(
    @Param('configKey') configKey: string,
    @Request() req: AuthenticatedRequest
  ) {
    await this.systemConfigurationService.deleteConfiguration(configKey, req.user.id);

    return {
      success: true,
      message: 'System configuration deleted successfully',
    };
  }

  @Get('maintenance-mode')
  @ApiOperation({ summary: 'Check maintenance mode status' })
  @ApiResponse({ status: 200, description: 'Maintenance mode status retrieved' })
  @Roles('admin')
  async getMaintenanceModeStatus() {
    const isEnabled = await this.systemConfigurationService.isMaintenanceModeEnabled();

    return {
      success: true,
      data: { enabled: isEnabled },
    };
  }

  @Put('maintenance-mode')
  @ApiOperation({ summary: 'Toggle maintenance mode' })
  @ApiResponse({ status: 200, description: 'Maintenance mode updated successfully' })
  @Roles('admin')
  async toggleMaintenanceMode(
    @Body() maintenanceData: {
      enabled: boolean;
      message?: string;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const config = await this.systemConfigurationService.updateConfiguration(
      'maintenance_mode',
      {
        configValue: {
          enabled: maintenanceData.enabled,
          message: maintenanceData.message || 'System is under maintenance. Please try again later.',
        },
      },
      req.user.id
    );

    return {
      success: true,
      data: config,
      message: `Maintenance mode ${maintenanceData.enabled ? 'enabled' : 'disabled'} successfully`,
    };
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'Get all feature flags' })
  @ApiResponse({ status: 200, description: 'Feature flags retrieved successfully' })
  @Roles('admin')
  async getFeatureFlags() {
    const flags = await this.systemConfigurationService.getConfigurations({
      configType: ConfigType.FEATURE_FLAG,
    });

    return {
      success: true,
      data: flags,
    };
  }

  @Get('feature-flags/:flagName')
  @ApiOperation({ summary: 'Check feature flag status' })
  @ApiResponse({ status: 200, description: 'Feature flag status retrieved' })
  @Roles('admin')
  async getFeatureFlagStatus(@Param('flagName') flagName: string) {
    const isEnabled = await this.systemConfigurationService.getFeatureFlag(flagName);

    return {
      success: true,
      data: { enabled: isEnabled },
    };
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get admin audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  @Roles('admin')
  async getAuditLogs(
    @Query('adminUserId') adminUserId?: string,
    @Query('actionType') actionType?: string,
    @Query('targetType') targetType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const filters = {
      adminUserId,
      actionType,
      targetType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 50,
    };

    const result = await this.adminAuditLogService.getAuditLogs(filters);

    return {
      success: true,
      data: result.logs,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  @Roles('admin')
  async getSystemHealth() {
    // Basic system health check
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
    };

    return {
      success: true,
      data: health,
    };
  }
  @Get('finance-stats')
  @ApiOperation({ summary: 'Get global finance statistics' })
  @ApiResponse({ status: 200, description: 'Finance stats retrieved successfully' })
  @Roles('admin')
  async getFinanceStats() {
    const stats = await this.financeManagementService.getFinanceStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get('global-ledger')
  @ApiOperation({ summary: 'Get global financial ledger' })
  @ApiResponse({ status: 200, description: 'Ledger retrieved successfully' })
  @Roles('admin')
  async getGlobalLedger(@Query('limit') limit?: number) {
    const ledger = await this.financeManagementService.getGlobalLedger(limit || 50);

    return {
      success: true,
      data: ledger,
    };
  }
}

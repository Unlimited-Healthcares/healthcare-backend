import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { SystemConfiguration, ConfigType } from '../entities/system-configuration.entity';
import { CreateSystemConfigurationDto, UpdateSystemConfigurationDto, SystemConfigurationFiltersDto } from '../dto/system-configuration.dto';
import { AdminAuditLogService } from './admin-audit-log.service';
import { JsonValue } from '../../types/common';

// Helper function to check if JsonValue has enabled property
function hasEnabledProperty(value: JsonValue): value is { enabled: boolean } {
  return typeof value === 'object' && value !== null && 'enabled' in value;
}

@Injectable()
export class SystemConfigurationService {
  constructor(
    @InjectRepository(SystemConfiguration)
    private configRepository: Repository<SystemConfiguration>,
    private auditLogService: AdminAuditLogService,
  ) { }

  async createConfiguration(
    createDto: CreateSystemConfigurationDto,
    createdBy: string,
  ): Promise<SystemConfiguration> {
    // Check if config key already exists
    const whereClause: FindOptionsWhere<SystemConfiguration> = { configKey: createDto.configKey };
    const existingConfig = await this.configRepository.findOne({
      where: whereClause
    });

    if (existingConfig) {
      throw new ConflictException('Configuration key already exists');
    }

    const config = this.configRepository.create({
      ...createDto,
      createdBy,
    });

    const savedConfig = await this.configRepository.save(config);

    await this.auditLogService.logAction({
      adminUserId: createdBy,
      actionType: 'system_config_created',
      targetType: 'system',
      targetId: savedConfig.id,
      actionDescription: `Created system configuration: ${createDto.configKey}`,
      newValues: JSON.parse(JSON.stringify(savedConfig)),
    });

    return savedConfig;
  }

  async getConfigurations(filters: SystemConfigurationFiltersDto): Promise<SystemConfiguration[]> {
    const queryBuilder = this.configRepository.createQueryBuilder('config');

    if (filters.configType) {
      queryBuilder.andWhere('config.configType = :configType', { configType: filters.configType });
    }
    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('config.isActive = :isActive', { isActive: filters.isActive });
    }
    if (filters.search) {
      queryBuilder.andWhere(
        '(config.configKey ILIKE :search OR config.description ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder.orderBy('config.configKey', 'ASC').getMany();
  }

  async getConfigurationByKey(configKey: string): Promise<SystemConfiguration> {
    const whereClause: FindOptionsWhere<SystemConfiguration> = { configKey };
    const config = await this.configRepository.findOne({
      where: whereClause
    });
    if (!config) {
      throw new NotFoundException('Configuration not found');
    }
    return config;
  }

  async updateConfiguration(
    configKey: string,
    updateDto: UpdateSystemConfigurationDto,
    updatedBy: string,
  ): Promise<SystemConfiguration> {
    try {
      const config = await this.getConfigurationByKey(configKey);
      const oldValues = { ...config };

      Object.assign(config, updateDto);
      config.updatedBy = updatedBy;

      const updatedConfig = await this.configRepository.save(config);

      await this.auditLogService.logAction({
        adminUserId: updatedBy,
        actionType: 'system_config_updated',
        targetType: 'system',
        targetId: config.id,
        actionDescription: `Updated system configuration: ${configKey}`,
        oldValues: JSON.parse(JSON.stringify(oldValues)),
        newValues: JSON.parse(JSON.stringify(updatedConfig)),
      });

      return updatedConfig;
    } catch (error) {
      if (error instanceof NotFoundException) {
        // Fallback to creation if not found
        return this.createConfiguration(
          {
            configKey,
            configValue: updateDto.configValue || {},
            configType: ConfigType.SYSTEM_SETTING,
            description: updateDto.description || `Auto-initialized configuration for ${configKey}`,
            isActive: updateDto.isActive ?? true,
          },
          updatedBy,
        );
      }
      throw error;
    }
  }

  async deleteConfiguration(configKey: string, deletedBy: string): Promise<void> {
    const config = await this.getConfigurationByKey(configKey);

    await this.configRepository.remove(config);

    await this.auditLogService.logAction({
      adminUserId: deletedBy,
      actionType: 'system_config_deleted',
      targetType: 'system',
      targetId: config.id,
      actionDescription: `Deleted system configuration: ${configKey}`,
      oldValues: JSON.parse(JSON.stringify(config)),
    });
  }

  // Helper methods for specific configurations
  async getMaintenanceConfig(): Promise<{ enabled: boolean; message: string }> {
    try {
      const config = await this.getConfigurationByKey('maintenance_mode');
      const value = config.configValue;

      const enabled = hasEnabledProperty(value) ? value.enabled : false;
      const message = (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string')
        ? value.message
        : 'System is under maintenance. Please try again later.';

      return { enabled, message };
    } catch {
      return { enabled: false, message: '' };
    }
  }

  async isMaintenanceModeEnabled(): Promise<boolean> {
    const config = await this.getMaintenanceConfig();
    return config.enabled;
  }

  async isUserRegistrationEnabled(): Promise<boolean> {
    try {
      const config = await this.getConfigurationByKey('user_registration_enabled');
      return hasEnabledProperty(config.configValue) ? config.configValue.enabled !== false : true;
    } catch {
      return true;
    }
  }

  async getFeatureFlag(flagName: string): Promise<boolean> {
    try {
      const config = await this.getConfigurationByKey(flagName);
      return hasEnabledProperty(config.configValue) ? config.configValue.enabled === true && config.isActive : false;
    } catch {
      return false;
    }
  }
}

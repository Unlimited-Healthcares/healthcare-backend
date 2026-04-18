import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SystemConfigurationService } from './admin/services/system-configuration.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly systemConfigService: SystemConfigurationService,
  ) { }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Welcome message' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system/settings')
  @Public()
  @ApiOperation({ summary: 'Get public system settings' })
  @ApiResponse({ status: 200, description: 'Public settings retrieved successfully' })
  async getPublicSettings() {
    const maintenance = await this.systemConfigService.getMaintenanceConfig();
    const isRegistrationEnabled = await this.systemConfigService.isUserRegistrationEnabled();
    const isAiEnabled = await this.systemConfigService.getFeatureFlag('ai_assistance_enabled');

    return {
      success: true,
      data: {
        maintenanceMode: maintenance.enabled,
        maintenanceMessage: maintenance.message,
        registrationEnabled: isRegistrationEnabled,
        aiAssistanceEnabled: isAiEnabled,
      }
    };
  }

  @Get('cors-test')
  @Public()
  @ApiOperation({ summary: 'Test CORS configuration' })
  @ApiResponse({ status: 200, description: 'CORS test successful' })
  corsTest() {
    return {
      message: 'CORS is working correctly',
      timestamp: new Date().toISOString(),
      cors: {
        origin: 'https://unlimitedhealthcares.com',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'Accept', 'Origin', 'X-Requested-With'],
        credentials: true
      }
    };
  }
} 
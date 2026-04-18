import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ComplianceService } from './compliance.service';
import { GdprService } from './gdpr/gdpr.service';
import { HipaaService } from './hipaa/hipaa.service';
import { AuthenticatedRequest } from '../types/request.types';
import { AuditInterceptor } from '../audit/interceptors/audit.interceptor';
import { AuditAction } from '../audit/decorators/audit-action.decorator';

import { IsString, IsBoolean, IsOptional, IsArray, IsEnum, IsDateString, IsUUID, IsNotEmpty } from 'class-validator';

// DTOs for request validation
export class RecordConsentDto {
  @IsString()
  @IsNotEmpty()
  consentType: string;

  @IsBoolean()
  consentGiven: boolean;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}

export class RequestDataDeletionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class DataCorrectionDto {
  @IsNotEmpty()
  correctionData: Record<string, unknown>;
}

export class DataBreachNotificationDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @IsString({ each: true })
  affectedUsers: string[];

  @IsArray()
  @IsString({ each: true })
  dataCategories: string[];

  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @IsDateString()
  detectionDate: Date;
}

export class PhiAccessValidationDto {
  @IsUUID()
  patientId: string;

  @IsEnum(['VIEW', 'EDIT', 'SHARE'])
  accessType: 'VIEW' | 'EDIT' | 'SHARE';

  @IsString()
  @IsNotEmpty()
  resourceType: string;
}

export class HipaaAuditReportDto {
  @IsDateString()
  startDate: Date;

  @IsDateString()
  endDate: Date;
}

@ApiTags('compliance')
@Controller('compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(AuditInterceptor)
@ApiBearerAuth('access-token')
export class ComplianceController {
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly gdprService: GdprService,
    private readonly hipaaService: HipaaService,
  ) {}

  @Post('consent')
  @AuditAction('RECORD_CONSENT')
  @ApiOperation({ summary: 'Record user consent for data processing' })
  @ApiResponse({ status: 201, description: 'Consent recorded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid consent data' })
  @ApiBody({ type: RecordConsentDto })
  @Roles('admin', 'patient', 'doctor', 'center')
  async recordConsent(
    @Body() recordConsentDto: RecordConsentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const consent = await this.complianceService.recordConsent(
        req.user.sub,
        recordConsentDto.consentType,
        recordConsentDto.consentGiven,
        recordConsentDto.ipAddress || req.ip,
      );
      return consent;
    } catch (error) {
      throw new HttpException(
        'Failed to record consent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('consent/:consentType')
  @ApiOperation({ summary: 'Check if user has given consent for specific processing' })
  @ApiResponse({ status: 200, description: 'Consent status retrieved' })
  @ApiResponse({ status: 400, description: 'Invalid consent type' })
  @Roles('admin', 'patient', 'doctor', 'center')
  async hasUserConsent(
    @Param('consentType') consentType: string,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const hasConsent = await this.complianceService.hasUserConsent(
        req.user.sub,
        consentType,
      );
      return { hasConsent };
    } catch (error) {
      throw new HttpException(
        'Failed to check user consent',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('consents')
  @ApiOperation({ summary: 'Get all active consents for the current user' })
  @ApiResponse({ status: 200, description: 'User consents retrieved' })
  @Roles('admin', 'patient', 'doctor', 'center')
  async getUserConsents(@Request() req: AuthenticatedRequest) {
    try {
      const consents = await this.complianceService.getUserConsents(req.user.sub);
      return consents;
    } catch (error) {
      throw new HttpException(
        'Failed to get user consents',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('data-deletion')
  @AuditAction('REQUEST_DATA_DELETION')
  @ApiOperation({ summary: 'Request data deletion (GDPR right to be forgotten)' })
  @ApiResponse({ status: 201, description: 'Data deletion request created' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiBody({ type: RequestDataDeletionDto })
  @Roles('admin', 'patient')
  async requestDataDeletion(
    @Body() requestDataDeletionDto: RequestDataDeletionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const request = await this.complianceService.requestDataDeletion(
        req.user.sub,
        requestDataDeletionDto.reason,
      );
      return request;
    } catch (error) {
      throw new HttpException(
        'Failed to request data deletion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('data-export')
  @AuditAction('EXPORT_USER_DATA')
  @ApiOperation({ summary: 'Export user data (GDPR right to access)' })
  @ApiResponse({ status: 200, description: 'User data exported successfully' })
  @Roles('admin', 'patient')
  async exportUserData(@Request() req: AuthenticatedRequest) {
    try {
      const userData = await this.gdprService.exportUserData(req.user.sub);
      return userData;
    } catch (error) {
      throw new HttpException(
        'Failed to export user data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('data-correction')
  @ApiOperation({ summary: 'Request data correction (GDPR right to rectification)' })
  @ApiResponse({ status: 200, description: 'Data correction request processed' })
  @ApiResponse({ status: 400, description: 'Invalid correction data' })
  @ApiBody({ type: DataCorrectionDto })
  @Roles('admin', 'patient')
  async processDataCorrection(
    @Body() dataCorrectionDto: DataCorrectionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      await this.gdprService.processDataCorrectionRequest(
        req.user.sub,
        dataCorrectionDto.correctionData,
      );
      return { message: 'Data correction request processed successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to process data correction request',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('data-breach')
  @ApiOperation({ summary: 'Report a data breach (admin only)' })
  @ApiResponse({ status: 200, description: 'Data breach notification processed' })
  @ApiResponse({ status: 400, description: 'Invalid breach data' })
  @ApiBody({ type: DataBreachNotificationDto })
  @Roles('admin')
  async handleDataBreachNotification(
    @Body() dataBreachNotificationDto: DataBreachNotificationDto,
  ) {
    try {
      await this.gdprService.handleDataBreachNotification(dataBreachNotificationDto);
      return { message: 'Data breach notification processed successfully' };
    } catch (error) {
      throw new HttpException(
        'Failed to process data breach notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('phi-access/validate')
  @ApiOperation({ summary: 'Validate PHI access (HIPAA compliance)' })
  @ApiResponse({ status: 200, description: 'PHI access validation result' })
  @ApiResponse({ status: 400, description: 'Invalid access data' })
  @ApiBody({ type: PhiAccessValidationDto })
  @Roles('admin', 'doctor', 'center')
  async validatePhiAccess(
    @Body() phiAccessValidationDto: PhiAccessValidationDto,
    @Request() req: AuthenticatedRequest,
  ) {
    try {
      const isAuthorized = await this.hipaaService.validatePhiAccess(
        req.user.sub,
        phiAccessValidationDto.patientId,
        phiAccessValidationDto.accessType,
        phiAccessValidationDto.resourceType,
      );
      return { isAuthorized };
    } catch (error) {
      throw new HttpException(
        'Failed to validate PHI access',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get recent security activity for the current user' })
  @ApiResponse({ status: 200, description: 'User activity logs retrieved' })
  @Roles('admin', 'patient', 'doctor', 'center')
  async getActivity(@Request() req: AuthenticatedRequest) {
    try {
      const { logs, total } = await this.complianceService.getUserActivity(req.user.sub);
      return { logs, total };
    } catch (error) {
      throw new HttpException(
        'Failed to get activity logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('hipaa-audit-report')
  @ApiOperation({ summary: 'Generate HIPAA audit report (admin only)' })
  @ApiResponse({ status: 200, description: 'HIPAA audit report generated' })
  @ApiResponse({ status: 400, description: 'Invalid report parameters' })
  @ApiBody({ type: HipaaAuditReportDto })
  @Roles('admin')
  async generateHipaaAuditReport(
    @Body() hipaaAuditReportDto: HipaaAuditReportDto,
  ) {
    try {
      const report = await this.hipaaService.generateHipaaAuditReport(
        hipaaAuditReportDto.startDate,
        hipaaAuditReportDto.endDate,
      );
      return report;
    } catch (error) {
      throw new HttpException(
        'Failed to generate HIPAA audit report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
} 
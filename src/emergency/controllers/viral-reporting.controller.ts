import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
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
import { ViralReportingService, TestResults } from '../services/viral-reporting.service';
import { ViralReportType, ReportStatus } from '../entities/viral-report.entity';
import { ContactType, ExposureRisk } from '../entities/contact-trace.entity';
import { AuthenticatedRequest } from '../../types/request.types';
import { JsonObject } from 'type-fest';

@ApiTags('emergency/viral-reporting')
@Controller('emergency/viral-reporting')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class ViralReportingController {
  constructor(private readonly viralReportingService: ViralReportingService) { }

  @Post('reports')
  @ApiOperation({ summary: 'Submit viral disease report' })
  @ApiResponse({ status: 201, description: 'Viral report submitted successfully' })
  @Roles('patient', 'doctor', 'nurse', 'admin', 'public_health', 'center', 'staff')
  async submitReport(
    @Body() reportData: {
      type: ViralReportType;
      isAnonymous?: boolean;
      diseaseType: string;
      symptoms: string[];
      onsetDate?: Date;
      exposureDate?: Date;
      locationLatitude?: number;
      locationLongitude?: number;
      locationAddress?: string;
      contactInformation?: JsonObject;
      affectedCount?: number;
      description?: string;
      riskFactors?: string[];
      preventiveMeasures?: string[];
      healthcareFacilityVisited?: string;
      testResults?: TestResults;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const report = await this.viralReportingService.createViralReport({
      ...reportData,
      reportedBy: reportData.isAnonymous ? undefined : req.user.id,
    });

    return {
      success: true,
      data: report,
      message: 'Viral report submitted successfully',
    };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get viral disease reports' })
  @ApiResponse({ status: 200, description: 'Viral reports retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'public_health', 'patient', 'center', 'staff')
  async getReports(
    @Request() req: AuthenticatedRequest,
    @Query('type') type?: ViralReportType,
    @Query('status') status?: ReportStatus,
    @Query('diseaseType') diseaseType?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userRole = req.user.roles[0];
    const filters: JsonObject = { type, status, diseaseType, page, limit };

    // BY USER REQUEST: Removed patient-only restriction

    const result = await this.viralReportingService.getViralReports(filters);

    return {
      success: true,
      data: result.reports,
      pagination: {
        total: result.total,
        page: page || 1,
        limit: limit || 10,
        pages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Put('reports/:id/status')
  @ApiOperation({ summary: 'Update viral report status' })
  @ApiResponse({ status: 200, description: 'Report status updated successfully' })
  @Roles('admin', 'public_health', 'center', 'staff')
  async updateReportStatus(
    @Param('id') id: string,
    @Body() updateData: {
      status: ReportStatus;
      investigationNotes?: string;
      publicHealthActions?: string[];
    },
    @Request() req: AuthenticatedRequest
  ) {
    const report = await this.viralReportingService.updateReportStatus(
      id,
      updateData.status,
      req.user.id,
      updateData.investigationNotes,
      updateData.publicHealthActions
    );

    return {
      success: true,
      data: report,
      message: 'Report status updated successfully',
    };
  }

  @Post('reports/:id/contact-traces')
  @ApiOperation({ summary: 'Add contact trace to viral report' })
  @ApiResponse({ status: 201, description: 'Contact trace added successfully' })
  @Roles('admin', 'doctor', 'nurse', 'public_health', 'center', 'staff')
  async addContactTrace(
    @Param('id') reportId: string,
    @Body() traceData: {
      contactName?: string;
      contactPhone?: string;
      contactEmail?: string;
      contactType: ContactType;
      exposureDate: Date;
      exposureDurationMinutes?: number;
      riskLevel: ExposureRisk;
      exposureLocation?: string;
      exposureDetails?: string;
      maskWornByCase?: boolean;
      maskWornByContact?: boolean;
      outdoorExposure?: boolean;
      notes?: string;
    }
  ) {
    const trace = await this.viralReportingService.addContactTrace({
      ...traceData,
      viralReportId: reportId,
    });

    return {
      success: true,
      data: trace,
      message: 'Contact trace added successfully',
    };
  }

  @Get('reports/:id/contact-traces')
  @ApiOperation({ summary: 'Get contact traces for viral report' })
  @ApiResponse({ status: 200, description: 'Contact traces retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'public_health', 'center', 'staff')
  async getContactTraces(@Param('id') reportId: string) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      throw new BadRequestException('Invalid UUID format');
    }

    const traces = await this.viralReportingService.getContactTraces(reportId);

    return {
      success: true,
      data: traces,
    };
  }

  @Get('public-health-summary')
  @ApiOperation({ summary: 'Get public health summary' })
  @ApiResponse({ status: 200, description: 'Public health summary retrieved successfully' })
  @Roles('admin', 'public_health', 'center', 'staff')
  async getPublicHealthSummary(
    @Query('diseaseType') diseaseType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const filters: JsonObject = { diseaseType };

    if (dateFrom) filters.dateFrom = new Date(dateFrom).toISOString();
    if (dateTo) filters.dateTo = new Date(dateTo).toISOString();

    const summary = await this.viralReportingService.getPublicHealthSummary(filters);

    return {
      success: true,
      data: summary,
    };
  }
}

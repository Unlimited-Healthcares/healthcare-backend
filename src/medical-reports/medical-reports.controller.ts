import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MedicalReportsService } from './medical-reports.service';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('medical-reports')
@Controller('medical-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class MedicalReportsController {
  constructor(private readonly reportsService: MedicalReportsService) { }

  @Get()
  @Roles('admin', 'center', 'doctor')
  @ApiOperation({ summary: 'Get all reports' })
  async findAll() {
    return await this.reportsService.findAll({});
  }

  @Post('generate/:recordId')
  @Roles('admin', 'center', 'doctor')
  @ApiOperation({ summary: 'Generate a digital medical report for a record' })
  async generateReport(
    @Param('recordId') recordId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.reportsService.generateReport(recordId, userId);
  }

  @Get('patient/:patientId')
  @Roles('admin', 'center', 'doctor', 'patient')
  @ApiOperation({ summary: 'Get all reports for a patient' })
  async getPatientReports(@Param('patientId') patientId: string) {
    return await this.reportsService.getReportsByPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details by ID' })
  async getReport(@Param('id') id: string) {
    return await this.reportsService.getReportById(id);
  }

  @Public()
  @Get('verify/:code')
  @ApiOperation({ summary: 'Publicly verify a report by its verification code' })
  async verifyReport(@Param('code') code: string) {
    return await this.reportsService.verifyReportByCode(code);
  }

  @Post(':id/grant-access/:targetId')
  @ApiOperation({ summary: 'Grant access to a report to another user' })
  async grantAccess(
    @Param('id') id: string,
    @Param('targetId') targetId: string,
  ) {
    return await this.reportsService.grantAccess(id, targetId);
  }

  @Get('shared/me')
  @ApiOperation({ summary: 'Get reports shared with the current user' })
  async getSharedWithMe(@GetCurrentUserId() userId: string) {
    return await this.reportsService.getSharedReports(userId);
  }
}

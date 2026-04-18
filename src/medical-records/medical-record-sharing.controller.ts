import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { MedicalRecordSharingService } from './medical-record-sharing.service';
import { CreateShareRequestDto } from './dto/create-share-request.dto';
import { RespondShareRequestDto } from './dto/respond-share-request.dto';
import { MedicalRecordShareRequest } from './entities/medical-record-share-request.entity';
import { MedicalRecordShare } from './entities/medical-record-share.entity';
import { MedicalRecordAccessLog } from './entities/medical-record-access-log.entity';

interface RequestWithUser {
  user: {
    userId: string;
    roles: string[];
  };
}

@ApiTags('Medical Record Sharing')
@Controller('medical-records/sharing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MedicalRecordSharingController {
  constructor(
    private readonly sharingService: MedicalRecordSharingService,
  ) {}

  // SHARE REQUESTS

  @Post('requests')
  @Roles('healthcare_provider', 'admin')
  @ApiOperation({ summary: 'Create a new share request' })
  @ApiResponse({ status: 201, description: 'Request created successfully', type: MedicalRecordShareRequest })
  async createShareRequest(
    @Body() createShareRequestDto: CreateShareRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<MedicalRecordShareRequest> {
    return await this.sharingService.createShareRequest(
      createShareRequestDto,
      req.user.userId,
    );
  }

  @Get('requests/:id')
  @Roles('healthcare_provider', 'admin', 'patient')
  @ApiOperation({ summary: 'Get a share request by ID' })
  @ApiParam({ name: 'id', description: 'Share request ID' })
  @ApiResponse({ status: 200, description: 'Share request found', type: MedicalRecordShareRequest })
  async getShareRequestById(@Param('id') id: string): Promise<MedicalRecordShareRequest> {
    return await this.sharingService.getShareRequestById(id);
  }

  @Get('requests/center/:centerId')
  @Roles('healthcare_provider', 'admin')
  @ApiOperation({ summary: 'Get share requests for a center' })
  @ApiParam({ name: 'centerId', description: 'Healthcare center ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by request status' })
  @ApiResponse({ status: 200, description: 'Share requests retrieved', type: [MedicalRecordShareRequest] })
  async getShareRequestsForCenter(
    @Param('centerId') centerId: string,
    @Query('status') status?: string,
  ): Promise<MedicalRecordShareRequest[]> {
    return await this.sharingService.getShareRequestsForCenter(centerId, status);
  }

  @Get('requests/patient/:patientId')
  @Roles('healthcare_provider', 'admin', 'patient')
  @ApiOperation({ summary: 'Get share requests for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by request status' })
  @ApiResponse({ status: 200, description: 'Share requests retrieved', type: [MedicalRecordShareRequest] })
  async getShareRequestsForPatient(
    @Param('patientId') patientId: string,
    @Query('status') status?: string,
  ): Promise<MedicalRecordShareRequest[]> {
    return await this.sharingService.getShareRequestsForPatient(patientId, status);
  }

  @Patch('requests/:id/respond')
  @Roles('healthcare_provider', 'admin')
  @ApiOperation({ summary: 'Respond to a share request' })
  @ApiParam({ name: 'id', description: 'Share request ID' })
  @ApiResponse({ status: 200, description: 'Request processed successfully', type: MedicalRecordShare })
  async respondToShareRequest(
    @Param('id') id: string,
    @Body() responseDto: RespondShareRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<MedicalRecordShare | null> {
    return await this.sharingService.respondToShareRequest(
      id,
      responseDto,
      req.user.userId,
    );
  }

  @Delete('requests/:id/cancel')
  @Roles('healthcare_provider', 'admin')
  @ApiOperation({ summary: 'Cancel a share request' })
  @ApiParam({ name: 'id', description: 'Share request ID' })
  @ApiResponse({ status: 200, description: 'Request canceled successfully' })
  async cancelShareRequest(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.sharingService.cancelShareRequest(id, req.user.userId);
    return { message: 'Request canceled successfully' };
  }

  // SHARES

  @Get('record/:recordId/shares')
  @Roles('healthcare_provider', 'admin', 'patient')
  @ApiOperation({ summary: 'Get active shares for a record' })
  @ApiParam({ name: 'recordId', description: 'Medical record ID' })
  @ApiResponse({ status: 200, description: 'Active shares retrieved', type: [MedicalRecordShare] })
  async getActiveShares(
    @Param('recordId') recordId: string,
  ): Promise<MedicalRecordShare[]> {
    return await this.sharingService.getActiveShares(recordId);
  }

  @Get('shares/:id')
  @Roles('healthcare_provider', 'admin', 'patient')
  @ApiOperation({ summary: 'Get a share by ID' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Share found', type: MedicalRecordShare })
  async getShareById(@Param('id') id: string): Promise<MedicalRecordShare> {
    return await this.sharingService.getShareById(id);
  }

  @Get('shares/center/:centerId')
  @Roles('healthcare_provider', 'admin')
  @ApiOperation({ summary: 'Get shares for a center' })
  @ApiParam({ name: 'centerId', description: 'Healthcare center ID' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Shares retrieved', type: [MedicalRecordShare] })
  async getSharesForCenter(
    @Param('centerId') centerId: string,
    @Query('active') active?: boolean,
  ): Promise<MedicalRecordShare[]> {
    return await this.sharingService.getSharesForCenter(centerId, active);
  }

  @Get('shares/patient/:patientId')
  @Roles('healthcare_provider', 'admin', 'patient')
  @ApiOperation({ summary: 'Get shares for a patient' })
  @ApiParam({ name: 'patientId', description: 'Patient ID' })
  @ApiQuery({ name: 'active', required: false, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Shares retrieved', type: [MedicalRecordShare] })
  async getSharesForPatient(
    @Param('patientId') patientId: string,
    @Query('active') active?: boolean,
  ): Promise<MedicalRecordShare[]> {
    return await this.sharingService.getSharesForPatient(patientId, active);
  }

  @Delete('shares/:id/revoke')
  @Roles('healthcare_provider', 'admin', 'patient')
  @ApiOperation({ summary: 'Revoke a share' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiQuery({ name: 'reason', required: false, description: 'Reason for revocation' })
  @ApiResponse({ status: 200, description: 'Share revoked successfully' })
  async revokeShare(
    @Param('id') id: string,
    @Query('reason') reason: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.sharingService.revokeShare(id, req.user.userId, reason);
    return { message: 'Share revoked successfully' };
  }

  // ACCESS LOGS

  @Post('shares/:id/access')
  @Roles('healthcare_provider', 'admin')
  @ApiOperation({ summary: 'Log access to a shared record' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiQuery({ name: 'accessType', description: 'Type of access (view, download, edit)' })
  @ApiQuery({ name: 'details', required: false, description: 'Additional details about the access' })
  @ApiResponse({ status: 200, description: 'Access logged successfully' })
  async logAccess(
    @Param('id') id: string,
    @Query('accessType') accessType: string,
    @Query('details') details: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.sharingService.logAccess(id, req.user.userId, accessType, details);
    return { message: 'Access logged successfully' };
  }

  @Get('shares/:id/logs')
  @Roles('healthcare_provider', 'admin', 'patient')
  @ApiOperation({ summary: 'Get access logs for a share' })
  @ApiParam({ name: 'id', description: 'Share ID' })
  @ApiResponse({ status: 200, description: 'Access logs retrieved', type: [MedicalRecordAccessLog] })
  async getAccessLogs(
    @Param('id') id: string,
  ): Promise<MedicalRecordAccessLog[]> {
    return await this.sharingService.getAccessLogs(id);
  }
} 
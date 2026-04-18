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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { AdminRegistrationService } from '../services/admin-registration.service';
import { AdminRegistrationRequestDto, AdminRegistrationApprovalDto } from '../../auth/dto/admin-registration.dto';
import { AdminRequestStatus } from '../entities/admin-registration-request.entity';
import { AuthenticatedRequest } from '../../types/request.types';
import { Request as ExpressRequest } from 'express';

@ApiTags('admin/registration')
@Controller('admin/registration')
export class AdminRegistrationController {
  constructor(
    private readonly adminRegistrationService: AdminRegistrationService,
  ) { }

  @Public()
  @Post('request')
  @ApiOperation({
    summary: 'Submit admin registration request',
    description: 'Submit a request for admin access (public endpoint)'
  })
  @ApiResponse({ status: 201, description: 'Admin registration request submitted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data or duplicate request' })
  @ApiResponse({ status: 409, description: 'User with this email already exists' })
  async submitAdminRequest(
    @Body() requestDto: AdminRegistrationRequestDto,
    @Request() req: ExpressRequest,
  ) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const request = await this.adminRegistrationService.createAdminRequest(
      requestDto,
      ipAddress,
      userAgent,
    );

    return {
      success: true,
      data: {
        id: request.id,
        email: request.email,
        status: request.status,
        message: 'Admin registration request submitted successfully. You will be notified once it is reviewed.',
      },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('requests')
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get all admin registration requests',
    description: 'Get all admin registration requests (admin only)'
  })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  @ApiQuery({
    name: 'status',
    enum: AdminRequestStatus,
    required: false,
    description: 'Filter by request status'
  })
  async getAllRequests(@Query('status') status?: AdminRequestStatus) {
    const requests = await this.adminRegistrationService.getAllRequests(status);

    return {
      success: true,
      data: requests,
      count: requests.length,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('requests/pending-count')
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get count of pending admin requests',
    description: 'Get the number of pending admin registration requests (admin only)'
  })
  @ApiResponse({ status: 200, description: 'Pending count retrieved successfully' })
  async getPendingRequestsCount() {
    const count = await this.adminRegistrationService.getPendingRequestsCount();

    return {
      success: true,
      data: { pendingCount: count },
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('requests/:id')
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get admin registration request by ID',
    description: 'Get a specific admin registration request (admin only)'
  })
  @ApiResponse({ status: 200, description: 'Request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async getRequestById(@Param('id') id: string) {
    const request = await this.adminRegistrationService.getRequestById(id);

    return {
      success: true,
      data: request,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Put('requests/:id/approve')
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Approve or reject admin registration request',
    description: 'Approve or reject an admin registration request (admin only)'
  })
  @ApiResponse({ status: 200, description: 'Request processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or request already processed' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async processRequest(
    @Param('id') id: string,
    @Body() approvalDto: AdminRegistrationApprovalDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const request = await this.adminRegistrationService.approveRequest(
      id,
      approvalDto,
      req.user.id,
    );

    const message = approvalDto.decision === 'approved'
      ? 'Admin registration request approved successfully'
      : 'Admin registration request rejected successfully';

    return {
      success: true,
      data: request,
      message,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('requests/:id')
  @Roles('admin')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Delete admin registration request',
    description: 'Delete a pending admin registration request (admin only)'
  })
  @ApiResponse({ status: 200, description: 'Request deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete processed request' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async deleteRequest(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.adminRegistrationService.deleteRequest(id, req.user.id);

    return {
      success: true,
      message: 'Admin registration request deleted successfully',
    };
  }
}

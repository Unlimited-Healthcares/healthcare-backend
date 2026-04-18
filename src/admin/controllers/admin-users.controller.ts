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
import { UserManagementService } from '../services/user-management.service';
import { UserActivityLogService, ActivityStatsResponse } from '../services/user-activity-log.service';
import { KycService } from '../../users/kyc.service';
import { UpdateUserManagementDto, UserManagementFiltersDto, BulkUserActionDto } from '../dto/user-management.dto';
import { ReviewKycDto } from '../../users/dto/kyc.dto';
import { AuthenticatedRequest } from '../../types/request.types';

@ApiTags('admin/users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AdminUsersController {
  constructor(
    private readonly userManagementService: UserManagementService,
    private readonly userActivityLogService: UserActivityLogService,
    private readonly kycService: KycService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get users with management info' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @Roles('admin')
  async getUsers(@Query() filters: UserManagementFiltersDto) {
    const result = await this.userManagementService.getUserManagement(filters);

    return {
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Provision a new user account' })
  @ApiResponse({ status: 201, description: 'User provisioned successfully' })
  @Roles('admin')
  async provisionUser(
    @Body() userData: {
      name: string;
      email: string;
      role: string;
      password?: string;
      phone?: string;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const user = await this.userManagementService.provisionUser(userData, req.user.id);

    return {
      success: true,
      data: user,
      message: 'User provisioned successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully' })
  @Roles('admin')
  async getUserStats() {
    const stats = await this.userManagementService.getUserStats();

    return {
      success: true,
      data: stats,
    };
  }

  @Get('dashboard-summary')
  @ApiOperation({ summary: 'Get summary data for admin dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard summary retrieved successfully' })
  @Roles('admin')
  async getDashboardSummary() {
    const summary = await this.userManagementService.getDashboardSummary();

    return {
      success: true,
      data: summary,
    };
  }

  // ─── KYC Management (placed before :userId params to avoid conflicts) ───

  @Get('kyc/submissions')
  @ApiOperation({ summary: 'Get all KYC submissions (optionally filter by status)' })
  @ApiResponse({ status: 200, description: 'KYC submissions retrieved' })
  @Roles('admin')
  async getKycSubmissions(@Query('status') status?: string) {
    const submissions = await this.kycService.getAllSubmissions(status);
    return {
      success: true,
      data: submissions,
    };
  }

  @Get('kyc/stats')
  @ApiOperation({ summary: 'Get KYC statistics' })
  @ApiResponse({ status: 200, description: 'KYC stats retrieved' })
  @Roles('admin')
  async getKycStats() {
    const stats = await this.kycService.getStats();
    return {
      success: true,
      data: stats,
    };
  }

  @Get('kyc/submissions/:submissionId')
  @ApiOperation({ summary: 'Get a specific KYC submission' })
  @ApiResponse({ status: 200, description: 'KYC submission retrieved' })
  @Roles('admin')
  async getKycSubmission(@Param('submissionId') submissionId: string) {
    const submission = await this.kycService.getSubmissionById(submissionId);
    return {
      success: true,
      data: submission,
    };
  }

  @Put('kyc/submissions/:submissionId/review')
  @ApiOperation({ summary: 'Review (approve/reject) a KYC submission' })
  @ApiResponse({ status: 200, description: 'KYC reviewed successfully' })
  @Roles('admin')
  async reviewKycSubmission(
    @Param('submissionId') submissionId: string,
    @Body() reviewDto: ReviewKycDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const submission = await this.kycService.reviewSubmission(
      submissionId,
      reviewDto.action,
      req.user.id,
      reviewDto.notes,
    );
    return {
      success: true,
      data: submission,
      message: `KYC ${reviewDto.action.toLowerCase()} successfully`,
    };
  }

  // ─── User Management by ID ─────────────────────────────────

  @Get('activities/all')
  @ApiOperation({ summary: 'Get all user activity logs' })
  @ApiResponse({ status: 200, description: 'All user activities retrieved successfully' })
  @Roles('admin')
  async getAllActivities(
    @Query('activityType') activityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const filters = {
      activityType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 50,
    };

    const result = await this.userActivityLogService.getAllActivities(filters);

    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @Get('activities/stats')
  @ApiOperation({ summary: 'Get user activity statistics' })
  @ApiResponse({ status: 200, description: 'Activity statistics retrieved successfully' })
  @Roles('admin')
  async getActivityStats(@Query('timeRange') timeRange?: 'day' | 'week' | 'month'): Promise<{ success: boolean; data: ActivityStatsResponse }> {
    const stats = await this.userActivityLogService.getActivityStats(timeRange || 'day');

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user management info by user ID' })
  @ApiResponse({ status: 200, description: 'User management info retrieved successfully' })
  @Roles('admin')
  async getUserById(@Param('userId') userId: string) {
    const userManagement = await this.userManagementService.getUserManagementByUserId(userId);

    return {
      success: true,
      data: userManagement,
    };
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user management info' })
  @ApiResponse({ status: 200, description: 'User management updated successfully' })
  @Roles('admin')
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateDto: UpdateUserManagementDto,
    @Request() req: AuthenticatedRequest
  ) {
    const userManagement = await this.userManagementService.updateUserManagement(
      userId,
      updateDto,
      req.user.id
    );

    return {
      success: true,
      data: userManagement,
      message: 'User management updated successfully',
    };
  }

  @Put(':userId/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @Roles('admin')
  async suspendUser(
    @Param('userId') userId: string,
    @Body() suspensionData: {
      suspendedUntil: string;
      suspensionReason: string;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const userManagement = await this.userManagementService.suspendUser(
      userId,
      new Date(suspensionData.suspendedUntil),
      suspensionData.suspensionReason,
      req.user.id
    );

    return {
      success: true,
      data: userManagement,
      message: 'User suspended successfully',
    };
  }

  @Put(':userId/activate')
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  @Roles('admin')
  async activateUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest
  ) {
    const userManagement = await this.userManagementService.activateUser(
      userId,
      req.user.id
    );

    return {
      success: true,
      data: userManagement,
      message: 'User activated successfully',
    };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Permanent account deletion' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @Roles('admin')
  async deleteUser(
    @Param('userId') userId: string,
    @Request() req: AuthenticatedRequest
  ) {
    await this.userManagementService.deleteUser(userId, req.user.id);

    return {
      success: true,
      message: 'User account and associated registry data deleted successfully',
    };
  }

  @Put(':userId/ban')
  @ApiOperation({ summary: 'Ban user' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @Roles('admin')
  async banUser(
    @Param('userId') userId: string,
    @Body() banData: { reason: string },
    @Request() req: AuthenticatedRequest
  ) {
    const userManagement = await this.userManagementService.banUser(
      userId,
      banData.reason,
      req.user.id
    );

    return {
      success: true,
      data: userManagement,
      message: 'User banned successfully',
    };
  }

  @Post('bulk-action')
  @ApiOperation({ summary: 'Perform bulk user actions' })
  @ApiResponse({ status: 200, description: 'Bulk action completed' })
  @Roles('admin')
  async bulkUserAction(
    @Body() bulkActionDto: BulkUserActionDto,
    @Request() req: AuthenticatedRequest
  ) {
    const result = await this.userManagementService.bulkUserAction(
      bulkActionDto,
      req.user.id
    );

    return {
      success: true,
      data: result,
      message: `Bulk action completed. ${result.success} successful, ${result.failed} failed.`,
    };
  }

  @Get(':userId/activities')
  @ApiOperation({ summary: 'Get user activity logs' })
  @ApiResponse({ status: 200, description: 'User activities retrieved successfully' })
  @Roles('admin')
  async getUserActivities(
    @Param('userId') userId: string,
    @Query('activityType') activityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const filters = {
      activityType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page || 1,
      limit: limit || 50,
    };

    const result = await this.userActivityLogService.getUserActivities(userId, filters);

    return {
      success: true,
      data: result.data,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
        totalPages: result.pagination.totalPages,
      },
    };
  }

  @Put(':userId/kyc/approve')
  @ApiOperation({ summary: 'Approve user KYC (legacy)' })
  @ApiResponse({ status: 200, description: 'KYC approved successfully' })
  @Roles('admin')
  async approveKyc(@Param('userId') userId: string) {
    const user = await this.userManagementService['usersService'].approveKyc(userId);
    return {
      success: true,
      data: this.userManagementService['usersService'].transformToSafeUser(user),
      message: 'KYC approved successfully',
    };
  }

  @Put(':userId/kyc/reject')
  @ApiOperation({ summary: 'Reject user KYC (legacy)' })
  @ApiResponse({ status: 200, description: 'KYC rejected successfully' })
  @Roles('admin')
  async rejectKyc(@Param('userId') userId: string) {
    const user = await this.userManagementService['usersService'].rejectKyc(userId);
    return {
      success: true,
      data: this.userManagementService['usersService'].transformToSafeUser(user),
      message: 'KYC rejected successfully',
    };
  }
}

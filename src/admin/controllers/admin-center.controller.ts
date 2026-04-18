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
import { CenterVerificationService } from '../services/center-verification.service';
import { CreateCenterVerificationRequestDto, UpdateCenterVerificationRequestDto, CenterVerificationFiltersDto } from '../dto/center-verification.dto';
import { AuthenticatedRequest } from '../../types/request.types';

@ApiTags('admin/centers')
@Controller('admin/centers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AdminCenterController {
  constructor(private readonly centerVerificationService: CenterVerificationService) {}

  @Post('verification-requests')
  @ApiOperation({ summary: 'Create center verification request' })
  @ApiResponse({ status: 201, description: 'Verification request created successfully' })
  @Roles('admin', 'center')
  async createVerificationRequest(
    @Body() createDto: CreateCenterVerificationRequestDto,
    @Request() req: AuthenticatedRequest
  ) {
    const request = await this.centerVerificationService.createVerificationRequest(
      createDto,
      req.user.id
    );

    return {
      success: true,
      data: request,
      message: 'Center verification request created successfully',
    };
  }

  @Get('verification-requests')
  @ApiOperation({ summary: 'Get center verification requests' })
  @ApiResponse({ status: 200, description: 'Verification requests retrieved successfully' })
  @Roles('admin')
  async getVerificationRequests(@Query() filters: CenterVerificationFiltersDto) {
    const result = await this.centerVerificationService.getVerificationRequests(filters);

    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
    };
  }

  @Get('verification-requests/:id')
  @ApiOperation({ summary: 'Get verification request by ID' })
  @ApiResponse({ status: 200, description: 'Verification request retrieved successfully' })
  @Roles('admin')
  async getVerificationRequestById(@Param('id') id: string) {
    const request = await this.centerVerificationService.getVerificationRequestById(id);

    return {
      success: true,
      data: request,
    };
  }

  @Put('verification-requests/:id')
  @ApiOperation({ summary: 'Update verification request' })
  @ApiResponse({ status: 200, description: 'Verification request updated successfully' })
  @Roles('admin')
  async updateVerificationRequest(
    @Param('id') id: string,
    @Body() updateDto: UpdateCenterVerificationRequestDto,
    @Request() req: AuthenticatedRequest
  ) {
    const request = await this.centerVerificationService.updateVerificationRequest(
      id,
      updateDto,
      req.user.id
    );

    return {
      success: true,
      data: request,
      message: 'Verification request updated successfully',
    };
  }

  @Put('verification-requests/:id/approve')
  @ApiOperation({ summary: 'Approve verification request' })
  @ApiResponse({ status: 200, description: 'Verification request approved successfully' })
  @Roles('admin')
  async approveVerificationRequest(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const request = await this.centerVerificationService.approveVerificationRequest(
      id,
      req.user.id
    );

    return {
      success: true,
      data: request,
      message: 'Verification request approved successfully',
    };
  }

  @Put('verification-requests/:id/reject')
  @ApiOperation({ summary: 'Reject verification request' })
  @ApiResponse({ status: 200, description: 'Verification request rejected successfully' })
  @Roles('admin')
  async rejectVerificationRequest(
    @Param('id') id: string,
    @Body() rejectionData: { rejectionReason: string },
    @Request() req: AuthenticatedRequest
  ) {
    const request = await this.centerVerificationService.rejectVerificationRequest(
      id,
      rejectionData.rejectionReason,
      req.user.id
    );

    return {
      success: true,
      data: request,
      message: 'Verification request rejected successfully',
    };
  }

  @Get('centers/:centerId/verification-history')
  @ApiOperation({ summary: 'Get center verification history' })
  @ApiResponse({ status: 200, description: 'Verification history retrieved successfully' })
  @Roles('admin')
  async getCenterVerificationHistory(@Param('centerId') centerId: string) {
    const history = await this.centerVerificationService.getCenterVerificationHistory(centerId);

    return {
      success: true,
      data: history,
    };
  }
}

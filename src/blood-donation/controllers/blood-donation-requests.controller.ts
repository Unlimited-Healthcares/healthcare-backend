
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../../auth/decorators/get-current-user-id.decorator';
import { BloodDonationRequestsService } from '../services/blood-donation-requests.service';
import { CreateBloodDonationRequestDto } from '../dto/create-blood-donation-request.dto';
import { RequestStatus, RequestPriority } from '../entities/blood-donation-request.entity';

@ApiTags('Blood Donation Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blood-donation/requests')
export class BloodDonationRequestsController {
  constructor(private readonly requestsService: BloodDonationRequestsService) { }

  @Post()
  @Roles('admin', 'healthcare_provider', 'staff', 'center')
  @ApiOperation({ summary: 'Create blood donation request' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Request created successfully' })
  async create(@Body() createRequestDto: CreateBloodDonationRequestDto) {
    return await this.requestsService.create(createRequestDto);
  }

  @Get()
  @Roles('admin', 'staff', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get all blood donation requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Requests retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('status') status?: RequestStatus,
    @Query('priority') priority?: RequestPriority,
    @Query('bloodType') bloodType?: string,
    @Query('centerId') centerId?: string,
  ) {
    return await this.requestsService.findAll(page, limit, status, priority, bloodType, centerId);
  }

  @Get('urgent')
  @Roles('admin', 'staff', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get urgent blood requests' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Urgent requests retrieved' })
  async getUrgentRequests() {
    return await this.requestsService.getUrgentRequests();
  }

  @Get(':id')
  @Roles('admin', 'staff', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get request by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Request not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.requestsService.findOne(id);
  }

  @Patch(':id/approve')
  @Roles('admin', 'healthcare_provider')
  @ApiOperation({ summary: 'Approve blood donation request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request approved successfully' })
  async approveRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.requestsService.approveRequest(id, userId);
  }

  @Patch(':id/fulfill')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Mark units as fulfilled for request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request updated successfully' })
  async fulfillRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() fulfillData: { unitsFulfilled: number },
  ) {
    return await this.requestsService.fulfillRequest(id, fulfillData.unitsFulfilled);
  }

  @Patch(':id/cancel')
  @Roles('admin', 'healthcare_provider')
  @ApiOperation({ summary: 'Cancel blood donation request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Request cancelled successfully' })
  async cancelRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelData: { reason?: string },
  ) {
    return await this.requestsService.cancelRequest(id, cancelData.reason);
  }
}

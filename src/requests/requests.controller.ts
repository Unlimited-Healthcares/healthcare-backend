import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { RespondRequestDto } from './dto/respond-request.dto';
import { GetRequestsDto } from './dto/get-requests.dto';
import { RequestResponseDto } from './dto/request-response.dto';
import { UserRequest } from './entities/user-request.entity';

interface RequestWithUser {
  user: {
    id: string;
    roles: string[];
  };
}

@ApiTags('requests')
@Controller('requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Create a new request' })
  @ApiResponse({ status: 201, description: 'Request created successfully', type: UserRequest })
  async createRequest(
    @Body() createRequestDto: CreateRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<UserRequest> {
    return await this.requestsService.createRequest({
      ...createRequestDto,
      senderId: req.user.id,
    });
  }

  @Get('received')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Get received requests' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by request status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by request type' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Received requests retrieved', type: [RequestResponseDto] })
  async getReceivedRequests(
    @Query() filters: GetRequestsDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.requestsService.getReceivedRequests(req.user.id, filters);
  }

  @Get('sent')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Get sent requests' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by request status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by request type' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page' })
  @ApiResponse({ status: 200, description: 'Sent requests retrieved', type: [RequestResponseDto] })
  async getSentRequests(
    @Query() filters: GetRequestsDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.requestsService.getSentRequests(req.user.id, filters);
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Get a request by ID' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request found', type: RequestResponseDto })
  async getRequestById(@Param('id') id: string): Promise<RequestResponseDto> {
    return await this.requestsService.getRequestById(id);
  }

  @Patch(':id/respond')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Respond to a request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request processed successfully', type: UserRequest })
  @ApiResponse({ status: 400, description: 'Missing required fields for approval' })
  async respondToRequest(
    @Param('id') id: string,
    @Body() respondDto: RespondRequestDto,
    @Req() req: RequestWithUser,
  ): Promise<UserRequest> {
    return await this.requestsService.respondToRequest(id, respondDto, req.user.id);
  }

  @Post(':id/confirm')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Confirm an approved request (accept schedule)' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request confirmed successfully', type: UserRequest })
  async confirmRequest(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<UserRequest> {
    return await this.requestsService.confirmRequest(id, req.user.id);
  }

  @Post(':id/decline')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Decline an approved request response (reject schedule)' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Response declined successfully', type: UserRequest })
  async declineResponse(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<UserRequest> {
    return await this.requestsService.declineResponse(id, req.user.id);
  }

  @Post(':id/payment-status')
  @Roles('admin', 'doctor', 'staff', 'center')
  @ApiOperation({ summary: 'Update payment status for a request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body('status') status: 'paid' | 'verified' | 'failed',
    @Body('reference') reference?: string,
  ): Promise<UserRequest> {
    return await this.requestsService.updatePaymentStatus(id, status, reference);
  }

  @Delete(':id')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Cancel a request' })
  @ApiParam({ name: 'id', description: 'Request ID' })
  @ApiResponse({ status: 200, description: 'Request canceled successfully' })
  async cancelRequest(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.requestsService.cancelRequest(id, req.user.id);
    return { message: 'Request canceled successfully' };
  }
}

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
  ForbiddenException,
  BadRequestException,
  HttpCode,
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
import { AmbulanceService } from '../services/ambulance.service';
import { EmergencyDispatchService } from '../services/emergency-dispatch.service';
import { Priority, RequestStatus } from '../entities/ambulance-request.entity';
import { AuthenticatedRequest } from '../../types/request.types';
import { EmergencyMedicalData } from '../entities/emergency-medical-data.entity';
import { JsonObject } from 'type-fest';

@ApiTags('emergency/ambulance')
@Controller('emergency/ambulance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class AmbulanceController {
  constructor(
    private readonly ambulanceService: AmbulanceService,
    private readonly dispatchService: EmergencyDispatchService,
  ) { }

  @Post('request')
  @ApiOperation({ summary: 'Request an ambulance' })
  @ApiResponse({ status: 201, description: 'Ambulance request created successfully' })
  @Roles('patient', 'doctor', 'nurse', 'admin', 'center', 'staff')
  async requestAmbulance(
    @Body() requestData: {
      patientName: string;
      patientAge?: number;
      patientGender?: string;
      patientPhone: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      pickupLatitude: number;
      pickupLongitude: number;
      pickupAddress: string;
      destinationLatitude?: number;
      destinationLongitude?: number;
      destinationAddress?: string;
      medicalCondition: string;
      symptoms?: string;
      priority: Priority;
      specialRequirements?: string;
      medicalHistory?: EmergencyMedicalData;
      insuranceInfo?: JsonObject;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const request = await this.ambulanceService.createAmbulanceRequest({
      ...requestData,
      requestedBy: req.user.id,
    });

    return {
      success: true,
      data: request,
      message: 'Ambulance request created successfully',
    };
  }

  @Get('requests')
  @ApiOperation({ summary: 'Get ambulance requests' })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'ambulance_driver', 'patient', 'center', 'staff')
  async getRequests(
    @Request() req: AuthenticatedRequest,
    @Query('status') status?: RequestStatus,
    @Query('priority') priority?: Priority,
    @Query('ambulanceId') ambulanceId?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userRole = req.user.roles[0]; // Use first role from roles array
    const filters: JsonObject = { status, priority, ambulanceId, page, limit };

    // BY USER REQUEST: Removed patient-only restriction

    const result = await this.ambulanceService.getAmbulanceRequests(filters);

    return {
      success: true,
      data: result.requests,
      pagination: {
        total: result.total,
        page: page || 1,
        limit: limit || 10,
        pages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get ambulance request by ID' })
  @ApiResponse({ status: 200, description: 'Ambulance request retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'patient', 'center', 'staff')
  async getRequest(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new BadRequestException('Invalid UUID format');
    }

    const request = await this.ambulanceService.getAmbulanceRequestById(id);

    // BY USER REQUEST: Removed patient-only restriction

    return {
      success: true,
      data: request,
    };
  }

  @Put('requests/:id/status')
  @ApiOperation({ summary: 'Update ambulance request status' })
  @ApiResponse({ status: 200, description: 'Request status updated successfully' })
  @Roles('admin', 'doctor', 'nurse', 'center', 'staff')
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() updateData: {
      status: RequestStatus;
      notes?: string;
      actualArrival?: Date;
      totalCost?: number;
      teamDetails?: Array<{
        name?: string;
        idNumber?: string;
        role: string;
      }>;
      patientCondition?: string;
      deliveryDetails?: {
        hospitalName?: string;
        receiverName?: string;
        receiverPhone?: string;
        receiverEmail?: string;
      };
    }
  ) {
    const request = await this.ambulanceService.updateRequestStatus(
      id,
      updateData.status,
      updateData
    );

    return {
      success: true,
      data: request,
      message: 'Request status updated successfully',
    };
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available ambulances' })
  @ApiResponse({ status: 200, description: 'Available ambulances retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'patient', 'center', 'staff')
  async getAvailableAmbulances(
    @Query('latitude') latitude?: number,
    @Query('longitude') longitude?: number
  ) {
    const location = latitude && longitude ? { latitude, longitude } : undefined;
    const ambulances = await this.ambulanceService.getAvailableAmbulances(location);

    return {
      success: true,
      data: ambulances,
    };
  }

  @Put('ambulances/:id/location')
  @ApiOperation({ summary: 'Update ambulance location' })
  @ApiResponse({ status: 200, description: 'Ambulance location updated successfully' })
  @Roles('admin', 'ambulance_driver')
  async updateAmbulanceLocation(
    @Param('id') id: string,
    @Body() locationData: {
      latitude: number;
      longitude: number;
    }
  ) {
    await this.ambulanceService.updateAmbulanceLocation(
      id,
      locationData.latitude,
      locationData.longitude
    );

    return {
      success: true,
      message: 'Ambulance location updated successfully',
    };
  }

  @Post('coordinate-response')
  @HttpCode(200)
  @ApiOperation({ summary: 'Coordinate emergency response' })
  @ApiResponse({ status: 200, description: 'Emergency response coordinated successfully' })
  @Roles('admin', 'doctor', 'nurse', 'center', 'staff')
  async coordinateEmergencyResponse(
    @Body() emergencyData: {
      type: 'ambulance' | 'fire' | 'police' | 'medical';
      priority: 'low' | 'medium' | 'high' | 'critical';
      location: { latitude: number; longitude: number };
      address?: string;
      description: string;
      contactNumber: string;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const response = await this.dispatchService.coordinateEmergencyResponse({
      ...emergencyData,
    }, req.user.id);

    return {
      success: true,
      data: response,
      message: 'Emergency response coordinated successfully',
    };
  }

  @Get('nearby-services')
  @ApiOperation({ summary: 'Find nearest emergency services' })
  @ApiResponse({ status: 200, description: 'Nearest emergency services found successfully' })
  @Roles('admin', 'doctor', 'nurse', 'patient', 'center', 'staff')
  async findNearestServices(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number
  ) {
    const services = await this.dispatchService.findNearestServices(
      latitude,
      longitude,
      'medical' // Default to medical services
    );

    return {
      success: true,
      data: services,
    };
  }
}

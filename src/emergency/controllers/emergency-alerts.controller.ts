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
import { EmergencyAlertsService } from '../services/emergency-alerts.service';
import { AlertType, AlertStatus } from '../entities/emergency-alert.entity';
import { AuthenticatedRequest } from '../../types/request.types';
import { JsonObject } from 'type-fest';

interface EmergencyMedicalData {
  bloodType?: string;
  allergies?: string[];
  medications?: string[];
  medicalConditions?: string[];
  emergencyContacts?: {
    name: string;
    phone: string;
    relationship: string;
  }[];
  notes?: string;
}

@ApiTags('emergency/alerts')
@Controller('emergency/alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class EmergencyAlertsController {
  constructor(private readonly alertsService: EmergencyAlertsService) { }

  @Post('sos')
  @ApiOperation({ summary: 'Trigger SOS alert' })
  @ApiResponse({ status: 201, description: 'SOS alert created successfully' })
  @Roles('patient', 'doctor', 'nurse', 'admin', 'center', 'staff')
  async createSOSAlert(
    @Body() alertData: {
      type: AlertType;
      description?: string;
      latitude: number;
      longitude: number;
      address?: string;
      contactNumber: string;
      patientId?: string;
      medicalInfo?: EmergencyMedicalData;
      isTestAlert?: boolean;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const alert = await this.alertsService.createSOSAlert({
      ...alertData,
      userId: req.user.id,
    });

    return {
      success: true,
      data: alert,
      message: 'SOS alert activated successfully',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get emergency alerts' })
  @ApiResponse({ status: 200, description: 'Emergency alerts retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'patient', 'center', 'staff')
  async getAlerts(
    @Request() req: AuthenticatedRequest,
    @Query('type') type?: AlertType,
    @Query('status') status?: AlertStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const userRole = req.user.roles[0]; // Use first role from roles array
    const filters: JsonObject = { type, status, page, limit };

    // BY USER REQUEST: Removed patient-only restriction

    const result = await this.alertsService.getActiveAlerts(filters);

    return {
      success: true,
      data: result.alerts,
      pagination: {
        total: result.total,
        page: page || 1,
        limit: limit || 10,
        pages: Math.ceil(result.total / (limit || 10)),
      },
    };
  }

  @Put(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge emergency alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @Roles('admin', 'doctor', 'nurse', 'center', 'staff')
  async acknowledgeAlert(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    const alert = await this.alertsService.acknowledgeAlert(id, req.user.id);

    return {
      success: true,
      data: alert,
      message: 'Alert acknowledged successfully',
    };
  }

  @Put(':id/resolve')
  @ApiOperation({ summary: 'Resolve emergency alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'center', 'staff')
  async resolveAlert(
    @Param('id') id: string,
    @Body() resolutionData: {
      resolutionNotes?: string;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const alert = await this.alertsService.resolveAlert(
      id,
      req.user.id,
      resolutionData.resolutionNotes
    );

    return {
      success: true,
      data: alert,
      message: 'Alert resolved successfully',
    };
  }

  @Post('emergency-contacts')
  @ApiOperation({ summary: 'Add emergency contact' })
  @ApiResponse({ status: 201, description: 'Emergency contact added successfully' })
  @Roles('patient', 'doctor', 'nurse', 'admin', 'center', 'staff')
  async addEmergencyContact(
    @Body() contactData: {
      contactName: string;
      contactPhone: string;
      contactEmail?: string;
      relationship: string;
      isPrimary?: boolean;
      isMedicalContact?: boolean;
      contactAddress?: string;
      notes?: string;
      notificationPreferences?: JsonObject;
    },
    @Request() req: AuthenticatedRequest
  ) {
    const contact = await this.alertsService.createEmergencyContact({
      ...contactData,
      userId: req.user.id,
    });

    return {
      success: true,
      data: contact,
      message: 'Emergency contact added successfully',
    };
  }

  @Get('emergency-contacts')
  @ApiOperation({ summary: 'Get emergency contacts' })
  @ApiResponse({ status: 200, description: 'Emergency contacts retrieved successfully' })
  @Roles('patient', 'doctor', 'nurse', 'admin', 'center', 'staff')
  async getEmergencyContacts(@Request() req: AuthenticatedRequest) {
    const contacts = await this.alertsService.getEmergencyContacts(req.user.id);

    return {
      success: true,
      data: contacts,
    };
  }
}

import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { EmergencyAlertsService } from '../services/emergency-alerts.service';
import { AuthenticatedRequest } from '../../types/request.types';
import { JsonObject } from 'type-fest';

@ApiTags('emergency/contacts')
@Controller('emergency/contacts') // Alias controller for backwards compatibility with older frontend apps
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class EmergencyContactsController {
    constructor(private readonly alertsService: EmergencyAlertsService) { }

    @Post()
    @ApiOperation({ summary: 'Add emergency contact (Legacy Alias)' })
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

    @Get()
    @ApiOperation({ summary: 'Get emergency contacts (Legacy Alias)' })
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

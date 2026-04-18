
import {
    Controller,
    Get,
    Query,
    UseGuards,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BloodDonationsService } from '../services/blood-donations.service';
import { JsonObject } from 'type-fest';

@ApiTags('Blood Donation Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blood-donation/analytics')
export class BloodDonationAnalyticsController {
    constructor(private readonly donationsService: BloodDonationsService) { }

    @Get()
    @Roles('admin', 'staff', 'doctor', 'nurse', 'healthcare_provider', 'center')
    @ApiOperation({ summary: 'Get blood donation analytics' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Analytics retrieved successfully' })
    async getAnalytics(@Query() filters: JsonObject) {
        const analytics = await this.donationsService.getAnalytics(filters);
        return {
            success: true,
            data: analytics,
        };
    }

    @Get('trends')
    @Roles('admin', 'staff', 'doctor', 'nurse', 'healthcare_provider', 'center')
    @ApiOperation({ summary: 'Get monthly donation trends' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Trends retrieved successfully' })
    async getTrends() {
        const trends = await this.donationsService.getMonthlyTrends();
        return {
            success: true,
            data: trends,
        };
    }

    @Get('inventory-distribution')
    @Roles('admin', 'staff', 'doctor', 'nurse', 'healthcare_provider', 'center')
    @ApiOperation({ summary: 'Get inventory distribution by blood type' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Distribution retrieved successfully' })
    async getInventoryDistribution() {
        const distribution = await this.donationsService.getBloodTypeBreakdown();
        return {
            success: true,
            data: distribution,
        };
    }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AmbulanceService } from '../services/ambulance.service';
import { EmergencyAlertsService } from '../services/emergency-alerts.service';
import { ViralReportingService } from '../services/viral-reporting.service';
import { AlertStatus } from '../entities/emergency-alert.entity';
import { RequestStatus } from '../entities/ambulance-request.entity';

@ApiTags('emergency')
@Controller('emergency')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class EmergencyKpiController {
    constructor(
        private readonly alertsService: EmergencyAlertsService,
        private readonly ambulanceService: AmbulanceService,
        private readonly viralReportingService: ViralReportingService,
    ) { }

    @Get('kpis')
    @ApiOperation({ summary: 'Get emergency system KPIs' })
    @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
    @Roles('admin', 'doctor', 'nurse', 'center', 'staff')
    async getKPIs() {
        const alerts = await this.alertsService.getActiveAlerts();
        const ambulanceRequests = await this.ambulanceService.getAmbulanceRequests();
        const viralReports = await this.viralReportingService.getViralReports();

        // Calculate basic KPIs based on the entities we have
        // In a real system, these would be aggregated via specialized queries
        const activeAlerts = alerts.alerts.filter(a => a.status === AlertStatus.ACTIVE).length;
        const criticalAlerts = alerts.alerts.filter(a => a.status === AlertStatus.RESPONDING).length;
        const pendingAmbulances = ambulanceRequests.requests.filter(r => r.status === RequestStatus.PENDING).length;
        const dispatchedAmbulances = ambulanceRequests.requests.filter(r => r.status === RequestStatus.DISPATCHED).length;

        return {
            activeAlerts,
            activeAlertsChange: 5, // Mock change data
            criticalAlerts,
            criticalAlertsChange: -2,
            pendingAmbulances,
            pendingAmbulancesChange: 1,
            dispatchedAmbulances,
            dispatchedAmbulancesChange: 3,
            averageResponseTime: 12, // Minutes
            averageResponseTimeChange: -1,
            viralReports: viralReports.total,
            viralReportsChange: 2
        };
    }
}

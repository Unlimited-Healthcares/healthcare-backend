import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { AmbulanceController } from './controllers/ambulance.controller';
import { EmergencyAlertsController } from './controllers/emergency-alerts.controller';
import { ViralReportingController } from './controllers/viral-reporting.controller';
import { EmergencyKpiController } from './controllers/emergency-kpi.controller';
import { EmergencyContactsController } from './controllers/emergency-contacts.controller';

// Services
import { AmbulanceService } from './services/ambulance.service';
import { EmergencyAlertsService } from './services/emergency-alerts.service';
import { ViralReportingService } from './services/viral-reporting.service';
import { EmergencyDispatchService } from './services/emergency-dispatch.service';
import { EmergencyGateway } from './emergency.gateway';

// Entities
import { AmbulanceRequest } from './entities/ambulance-request.entity';
import { Ambulance } from './entities/ambulance.entity';
import { EmergencyAlert } from './entities/emergency-alert.entity';
import { EmergencyContact } from './entities/emergency-contact.entity';
import { ViralReport } from './entities/viral-report.entity';
import { ContactTrace } from './entities/contact-trace.entity';
import { EmergencyDispatch } from './entities/emergency-dispatch.entity';

// External modules
import { LocationModule } from '../location/location.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { IntegrationsModule } from '../integrations/integrations.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AmbulanceRequest,
      Ambulance,
      EmergencyAlert,
      EmergencyContact,
      ViralReport,
      ContactTrace,
      EmergencyDispatch,
    ]),
    ConfigModule,
    LocationModule,
    NotificationsModule,
    IntegrationsModule,
    AuditModule,
  ],
  controllers: [
    AmbulanceController,
    EmergencyAlertsController,
    ViralReportingController,
    EmergencyKpiController,
    EmergencyContactsController,
  ],
  providers: [
    AmbulanceService,
    EmergencyAlertsService,
    ViralReportingService,
    EmergencyDispatchService,
    EmergencyGateway,
  ],
  exports: [
    AmbulanceService,
    EmergencyAlertsService,
    ViralReportingService,
    EmergencyDispatchService,
    EmergencyGateway,
  ],
})
export class EmergencyModule { }

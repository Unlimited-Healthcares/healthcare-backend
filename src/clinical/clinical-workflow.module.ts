import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Encounter } from './encounters/entities/encounter.entity';
import { Prescription } from './prescriptions/entities/prescription.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { MedicationAdherence } from './adherence/entities/medication-adherence.entity';
import { ConsentForm } from './consents/entities/consent-form.entity';
import { EncountersService } from './encounters/encounters.service';
import { PrescriptionsService } from './prescriptions/prescriptions.service';
import { AdherenceService } from './adherence/adherence.service';
import { ConsentsService } from './consents/consents.service';
import { EncountersController } from './encounters/encounters.controller';
import { PrescriptionsController } from './prescriptions/prescriptions.controller';
import { AdherenceController } from './adherence/adherence.controller';
import { ConsentsController } from './consents/consents.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { ChatModule } from '../chat/chat.module';
import { AuditModule } from '../audit/audit.module';
import { UsersModule } from '../users/users.module';

import { ClinicalWorkspace } from './workspaces/entities/clinical-workspace.entity';
import { ClinicalLog } from './workspaces/entities/clinical-log-entry.entity';
import { ClinicalWorkspacesService } from './workspaces/clinical-workspaces.service';
import { ClinicalWorkspacesController } from './workspaces/clinical-workspaces.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Encounter, 
            Prescription, 
            HealthcareCenter, 
            MedicationAdherence, 
            ConsentForm,
            ClinicalWorkspace,
            ClinicalLog
        ]),
        NotificationsModule,
        PatientsModule,
        AppointmentsModule,
        ChatModule,
        AuditModule,
        UsersModule,
    ],
    controllers: [
        EncountersController,
        PrescriptionsController,
        AdherenceController,
        ConsentsController,
        ClinicalWorkspacesController,
    ],
    providers: [
        EncountersService,
        PrescriptionsService,
        AdherenceService,
        ConsentsService,
        ClinicalWorkspacesService,
    ],
    exports: [
        EncountersService,
        PrescriptionsService,
        AdherenceService,
        ConsentsService,
        ClinicalWorkspacesService,
    ],
})
export class ClinicalWorkflowModule { }

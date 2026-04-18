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

@Module({
    imports: [
        TypeOrmModule.forFeature([Encounter, Prescription, HealthcareCenter, MedicationAdherence, ConsentForm]),
        NotificationsModule,
        PatientsModule,
        AppointmentsModule,
    ],
    controllers: [
        EncountersController,
        PrescriptionsController,
        AdherenceController,
        ConsentsController,
    ],
    providers: [
        EncountersService,
        PrescriptionsService,
        AdherenceService,
        ConsentsService,
    ],
    exports: [
        EncountersService,
        PrescriptionsService,
        AdherenceService,
        ConsentsService,
    ],
})
export class ClinicalWorkflowModule { }

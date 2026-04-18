import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { User } from '../users/entities/user.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { Patient } from '../patients/entities/patient.entity';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { CenterService } from '../centers/entities/center-service.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            User,
            HealthcareCenter,
            Patient,
            MedicalRecord,
            Appointment,
            CenterService,
        ]),
    ],
    controllers: [SearchController],
    providers: [SearchService],
    exports: [SearchService],
})
export class SearchModule { }

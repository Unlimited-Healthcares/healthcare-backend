
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { Patient, PatientVisit } from './entities/patient.entity';
import { PatientProviderRelationship } from './entities/patient-provider-relationship.entity';
import { Profile } from '../users/entities/profile.entity';
import { User } from '../users/entities/user.entity';
import { IdGeneratorService } from '../users/services/id-generator.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, PatientVisit, PatientProviderRelationship, Profile, User]),
    NotificationsModule
  ],
  controllers: [PatientsController],
  providers: [PatientsService, IdGeneratorService],
  exports: [PatientsService],
})
export class PatientsModule { }

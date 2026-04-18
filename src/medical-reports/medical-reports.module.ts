import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalReport } from './entities/medical-report.entity';
import { MedicalReportsService } from './medical-reports.service';
import { MedicalReportsController } from './medical-reports.controller';
import { MedicalRecord } from '../medical-records/entities/medical-record.entity';
import { Profile } from '../users/entities/profile.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { Patient } from '../patients/entities/patient.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalReport,
      MedicalRecord,
      Profile,
      HealthcareCenter,
      Patient,
    ]),
    SupabaseModule,
    NotificationsModule,
  ],
  controllers: [MedicalReportsController],
  providers: [MedicalReportsService],
  exports: [MedicalReportsService],
})
export class MedicalReportsModule { }

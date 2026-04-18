import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordFilesService } from './medical-record-files.service';
import { MedicalRecordVersionsService } from './medical-record-versions.service';
import { MedicalRecordCategoriesService } from './medical-record-categories.service';
import { MedicalRecordSharingService } from './medical-record-sharing.service';
import { MedicalRecordsController } from './medical-records.controller';
import { MedicalRecordSharingController } from './medical-record-sharing.controller';
import { MedicalRecord } from './entities/medical-record.entity';
import { MedicalRecordFile } from './entities/medical-record-file.entity';
import { MedicalRecordVersion } from './entities/medical-record-version.entity';
import { MedicalRecordCategory } from './entities/medical-record-category.entity';
import { MedicalRecordShare } from './entities/medical-record-share.entity';
import { MedicalRecordShareRequest } from './entities/medical-record-share-request.entity';
import { MedicalRecordAccessLog } from './entities/medical-record-access-log.entity';
import { SupabaseModule } from '../supabase/supabase.module';
import { Patient } from '../patients/entities/patient.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MedicalRecord,
      MedicalRecordFile,
      MedicalRecordVersion,
      MedicalRecordCategory,
      MedicalRecordShare,
      MedicalRecordShareRequest,
      MedicalRecordAccessLog,
      Patient,
      Appointment,
      User,
    ]),
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      },
    }),
    SupabaseModule,
    NotificationsModule,
  ],
  controllers: [MedicalRecordsController, MedicalRecordSharingController],
  providers: [
    MedicalRecordsService,
    MedicalRecordFilesService,
    MedicalRecordVersionsService,
    MedicalRecordCategoriesService,
    MedicalRecordSharingService,
  ],
  exports: [
    MedicalRecordsService,
    MedicalRecordFilesService,
    MedicalRecordVersionsService,
    MedicalRecordCategoriesService,
    MedicalRecordSharingService,
  ],
})
export class MedicalRecordsModule { }

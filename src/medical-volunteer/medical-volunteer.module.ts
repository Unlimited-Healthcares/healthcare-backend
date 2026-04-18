import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalVolunteerSubmission } from './entities/medical-volunteer-submission.entity';
import { MedicalVolunteerService } from './medical-volunteer.service';
import { MedicalVolunteerController } from './medical-volunteer.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([MedicalVolunteerSubmission]),
        UsersModule,
        NotificationsModule,
        AuditModule,
    ],
    controllers: [MedicalVolunteerController],
    providers: [MedicalVolunteerService],
    exports: [MedicalVolunteerService],
})
export class MedicalVolunteerModule { }

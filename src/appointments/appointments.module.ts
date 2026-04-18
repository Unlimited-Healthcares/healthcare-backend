import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { RecurringAppointmentsService } from './recurring-appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentType } from './entities/appointment-type.entity';
import { ProviderAvailability } from './entities/provider-availability.entity';
import { AppointmentParticipant } from './entities/appointment-participant.entity';
import { AppointmentReminder } from './entities/appointment-reminder.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { RemindersCronService } from './reminders-cron.service';
import { CentersModule } from '../centers/centers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      AppointmentType,
      ProviderAvailability,
      AppointmentParticipant,
      AppointmentReminder,
      Patient,
      User,
      HealthcareCenter,
    ]),
    AuditModule,
    NotificationsModule,
    UsersModule,
    CentersModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, RecurringAppointmentsService, RemindersCronService],
  exports: [AppointmentsService, RecurringAppointmentsService],
})
export class AppointmentsModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { UserRequest } from './entities/user-request.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { CentersModule } from '../centers/centers.module';
import { PatientsModule } from '../patients/patients.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { UsersModule } from '../users/users.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRequest, User]),
    NotificationsModule,
    CentersModule,
    PatientsModule,
    AppointmentsModule,
    UsersModule,
    WalletsModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
  exports: [RequestsService],
})
export class RequestsModule { }

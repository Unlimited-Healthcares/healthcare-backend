import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareTasksService } from './care-tasks.service';
import { CareTasksController } from './care-tasks.controller';
import { CareTask } from './entities/care-task.entity';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CareTask]),
    PatientsModule,
    UsersModule,
  ],
  controllers: [CareTasksController],
  providers: [CareTasksService],
  exports: [CareTasksService],
})
export class CareTasksModule {}

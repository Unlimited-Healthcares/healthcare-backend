import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DischargePlan } from './entities/discharge-plan.entity';
import { DischargeService } from './services/discharge.service';
import { DischargeController } from './controllers/discharge.controller';
import { CareTask } from '../../care-tasks/entities/care-task.entity';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([DischargePlan, CareTask]),
        NotificationsModule
    ],
    controllers: [DischargeController],
    providers: [DischargeService],
    exports: [DischargeService]
})
export class DischargeModule { }

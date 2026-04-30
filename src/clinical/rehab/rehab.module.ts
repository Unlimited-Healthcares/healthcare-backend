import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RehabPlan } from './entities/rehab-plan.entity';
import { RehabService } from './rehab.service';
import { RehabController } from './rehab.controller';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([RehabPlan]),
        NotificationsModule
    ],
    controllers: [RehabController],
    providers: [RehabService],
    exports: [RehabService]
})
export class RehabModule { }

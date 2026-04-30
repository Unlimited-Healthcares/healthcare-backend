import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BiotechController } from './biotech.controller';
import { BiotechService } from './biotech.service';
import { Equipment } from './entities/equipment.entity';
import { MaintenanceTicket } from './entities/maintenance-ticket.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Equipment, MaintenanceTicket])
    ],
    controllers: [BiotechController],
    providers: [BiotechService],
    exports: [BiotechService]
})
export class BiotechModule { }

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PharmacyInventory } from './entities/inventory.entity';
import { PharmacyService } from './pharmacy.service';
import { PharmacyController } from './pharmacy.controller';

@Module({
    imports: [TypeOrmModule.forFeature([PharmacyInventory])],
    controllers: [PharmacyController],
    providers: [PharmacyService],
    exports: [PharmacyService],
})
export class PharmacyModule { }

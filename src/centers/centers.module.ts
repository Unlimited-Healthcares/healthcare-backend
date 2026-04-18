
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentersService } from './centers.service';
import { CentersController } from './centers.controller';
import { AssetsController } from './assets.controller';
import { HealthcareCenter } from './entities/center.entity';
import { CenterStaff } from './entities/center-staff.entity';
import { CenterService } from './entities/center-service.entity';
import { CenterAvailability } from './entities/center-availability.entity';
import { FacilityAsset } from './entities/facility-asset.entity';
import { IdGeneratorService } from '../users/services/id-generator.service';
import { LocationModule } from '../location/location.module';
import { UsersModule } from '../users/users.module';

import { MulterModule } from '@nestjs/platform-express';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HealthcareCenter,
      CenterStaff,
      CenterService,
      CenterAvailability,
      FacilityAsset
    ]),
    LocationModule,
    UsersModule,
    MulterModule.register({}),
    SupabaseModule,
  ],
  controllers: [CentersController, AssetsController],
  providers: [CentersService, IdGeneratorService],
  exports: [CentersService],
})
export class CentersModule { }

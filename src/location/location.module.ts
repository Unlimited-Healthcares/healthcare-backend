import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { LocationService } from './services/location.service';
import { GeocodingService } from './services/geocoding.service';
import { GeofencingService } from './services/geofencing.service';
import { LocationController } from './controllers/location.controller';
import { LocationHistory } from './entities/location-history.entity';
import { GeofenceZone } from './entities/geofence-zone.entity';
import { AuditModule } from '../audit/audit.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LocationHistory, GeofenceZone]),
    ConfigModule,
    AuditModule,
    CacheModule,
  ],
  controllers: [LocationController],
  providers: [LocationService, GeocodingService, GeofencingService],
  exports: [LocationService, GeocodingService, GeofencingService],
})
export class LocationModule {} 
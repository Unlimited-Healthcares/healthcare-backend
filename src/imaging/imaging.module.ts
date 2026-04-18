import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagingService } from './imaging.service';
import { ImagingController } from './imaging.controller';
import { ImagingStudy } from './entities/imaging-study.entity';
import { ImagingFile } from './entities/imaging-file.entity';
import { AuditModule } from '../audit/audit.module';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImagingStudy, ImagingFile]),
    AuditModule,
    SupabaseModule,
  ],
  controllers: [ImagingController],
  providers: [ImagingService],
  exports: [ImagingService],
})
export class ImagingModule {}

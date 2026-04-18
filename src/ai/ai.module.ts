import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AiController } from './ai.controller';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { SymptomSession } from './entities/symptom-session.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SymptomSession]),
  ],
  controllers: [AiController],
  providers: [SymptomAnalysisService],
  exports: [SymptomAnalysisService],
})
export class AiModule {}

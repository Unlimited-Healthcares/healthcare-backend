
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoConferencingService } from './services/video-conferencing.service';
import { VideoConferencingController } from './controllers/video-conferencing.controller';
import { VideoConferenceController } from './controllers/video-conference.controller';
import { VideoConferenceGateway } from './websocket.gateway';
import { VideoConference } from './entities/video-conference.entity';
import { VideoConferenceParticipant } from './entities/video-conference-participant.entity';
import { VideoConferenceRecording } from './entities/video-conference-recording.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VideoConference,
      VideoConferenceParticipant,
      VideoConferenceRecording,
    ]),
    AuditModule,
  ],
  controllers: [VideoConferencingController, VideoConferenceController],
  providers: [VideoConferencingService, VideoConferenceGateway],
  exports: [VideoConferencingService],
})
export class VideoConferencingModule {}

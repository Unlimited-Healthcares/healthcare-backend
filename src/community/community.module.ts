import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { CommunityPost } from './entities/post.entity';
import { CommunityEvent } from './entities/event.entity';
import { CommunityJob } from './entities/job.entity';
import { JobApplication } from './entities/job-application.entity';
import { User } from '../users/entities/user.entity';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommunityPost, CommunityEvent, CommunityJob, JobApplication, User]),
    UploadsModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule { }

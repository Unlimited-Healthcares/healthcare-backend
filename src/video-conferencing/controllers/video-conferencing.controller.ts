
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery
} from '@nestjs/swagger';
import { VideoConferencingService } from '../services/video-conferencing.service';
import { CreateVideoConferenceDto } from '../dto/create-video-conference.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetCurrentUserId } from '../../auth/decorators/get-current-user-id.decorator';

@ApiTags('video-conferencing')
@Controller('video-conferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class VideoConferencingController {
  constructor(private readonly videoConferencingService: VideoConferencingService) { }



  @Post()
  @ApiOperation({ summary: 'Create a new video conference' })
  @ApiResponse({ status: 201, description: 'Video conference created successfully' })
  createConference(
    @Body() createConferenceDto: CreateVideoConferenceDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.createConference(createConferenceDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user video conferences' })
  @ApiResponse({ status: 200, description: 'Conferences retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserConferences(
    @GetCurrentUserId() userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.videoConferencingService.getUserConferences(userId, page, limit);
  }

  @Get('kpis')
  @ApiOperation({ summary: 'Get video conference KPIs' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  getKPIs(@GetCurrentUserId() userId: string) {
    return this.videoConferencingService.getKPIs(userId);
  }

  @Get(':conferenceId')
  @ApiOperation({ summary: 'Get video conference details' })
  @ApiResponse({ status: 200, description: 'Conference retrieved successfully' })
  getConference(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.getConference(conferenceId, userId);
  }

  @Post(':conferenceId/start')
  @ApiOperation({ summary: 'Start video conference' })
  @ApiResponse({ status: 200, description: 'Conference started successfully' })
  startConference(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.startConference(conferenceId, userId);
  }

  @Post(':conferenceId/end')
  @ApiOperation({ summary: 'End video conference' })
  @ApiResponse({ status: 200, description: 'Conference ended successfully' })
  endConference(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.endConference(conferenceId, userId);
  }

  @Post(':conferenceId/join')
  @ApiOperation({ summary: 'Join video conference' })
  @ApiResponse({ status: 200, description: 'Joined conference successfully' })
  joinConference(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.joinConference(conferenceId, userId);
  }

  @Post(':conferenceId/leave')
  @ApiOperation({ summary: 'Leave video conference' })
  @ApiResponse({ status: 200, description: 'Left conference successfully' })
  leaveConference(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.leaveConference(conferenceId, userId);
  }

  @Post(':conferenceId/recording/toggle')
  @ApiOperation({ summary: 'Toggle conference recording' })
  @ApiResponse({ status: 200, description: 'Recording toggled successfully' })
  toggleRecording(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.toggleRecording(conferenceId, userId);
  }

  @Patch(':conferenceId/settings')
  @ApiOperation({ summary: 'Update participant settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  updateSettings(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @Body() settings: {
      isCameraEnabled?: boolean;
      isMicrophoneEnabled?: boolean;
      isScreenSharing?: boolean;
    },
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.updateParticipantSettings(conferenceId, userId, settings);
  }

  @Get(':conferenceId/recordings')
  @ApiOperation({ summary: 'Get conference recordings' })
  @ApiResponse({ status: 200, description: 'Recordings retrieved successfully' })
  getRecordings(
    @Param('conferenceId', ParseUUIDPipe) conferenceId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.videoConferencingService.getConferenceRecordings(conferenceId, userId);
  }
}

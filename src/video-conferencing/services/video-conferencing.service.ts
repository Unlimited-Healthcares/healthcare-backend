import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoConference } from '../entities/video-conference.entity';
import { VideoConferenceParticipant } from '../entities/video-conference-participant.entity';
import { VideoConferenceRecording } from '../entities/video-conference-recording.entity';
import { CreateVideoConferenceDto } from '../dto/create-video-conference.dto';
import { AuditService } from '../../audit/audit.service';
import { v4 as uuidv4 } from 'uuid';
import { Not, IsNull } from 'typeorm';

@Injectable()
export class VideoConferencingService {
  constructor(
    @InjectRepository(VideoConference)
    private conferenceRepository: Repository<VideoConference>,
    @InjectRepository(VideoConferenceParticipant)
    private participantRepository: Repository<VideoConferenceParticipant>,
    @InjectRepository(VideoConferenceRecording)
    private recordingRepository: Repository<VideoConferenceRecording>,
    private auditService: AuditService,
  ) { }

  async createConference(createConferenceDto: CreateVideoConferenceDto, hostUserId: string) {
    const { participantIds = [], ...conferenceData } = createConferenceDto;

    const conference = this.conferenceRepository.create({
      ...conferenceData,
      conferenceId: `conf_${Date.now()}_${uuidv4().substring(0, 8)}`,
      hostUserId,
      scheduledStartTime: conferenceData.scheduledStartTime ? new Date(conferenceData.scheduledStartTime) : null,
      scheduledEndTime: conferenceData.scheduledEndTime ? new Date(conferenceData.scheduledEndTime) : null,
    });

    const savedConference = await this.conferenceRepository.save(conference);

    // Add participants (ensure host is included)
    const uniqueParticipantIds = Array.from(new Set([...participantIds, hostUserId]));

    const participants = uniqueParticipantIds.map(userId =>
      this.participantRepository.create({
        conferenceId: savedConference.id,
        userId,
        role: userId === hostUserId ? 'host' : 'participant',
      })
    );

    await this.participantRepository.save(participants);

    await this.auditService.logActivity(
      hostUserId,
      'video_conference',
      'CREATE_CONFERENCE',
      'Video conference created',
      { conferenceId: savedConference.id, type: conferenceData.type, participants: participantIds.length }
    );

    return this.getConferenceWithDetails(savedConference.id);
  }

  async getUserConferences(userId: string, page = 1, limit = 20) {
    const [conferences, total] = await this.conferenceRepository
      .createQueryBuilder('conference')
      .leftJoinAndSelect('conference.participants', 'participant')
      .where('participant.userId = :userId', { userId })
      .orderBy('conference.scheduledStartTime', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      conferences,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getKPIs(_userId: string) {
    const totalConferences = await this.conferenceRepository.count();
    const activeConferences = await this.conferenceRepository.count({ where: { status: 'active' } });
    const scheduledConferences = await this.conferenceRepository.count({ where: { status: 'scheduled' } });

    // Simplified KPIs for now
    return {
      totalConferences,
      totalConferencesChange: 0,
      activeConferences,
      activeConferencesChange: 0,
      scheduledConferences,
      scheduledConferencesChange: 0,
      totalParticipants: 0,
      totalParticipantsChange: 0,
      averageDuration: 0,
      averageDurationChange: 0,
      recordingRate: 0,
      recordingRateChange: 0
    };
  }

  async getConference(conferenceId: string, userId: string) {
    // Verify user is participant
    await this.verifyUserInConference(conferenceId, userId);

    return await this.getConferenceWithDetails(conferenceId);
  }

  async startConference(conferenceId: string, userId: string) {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    // Verify user is host
    if (conference.hostUserId !== userId) {
      throw new ForbiddenException('Only the host can start the conference');
    }

    if (conference.status !== 'scheduled') {
      throw new ForbiddenException('Conference cannot be started');
    }

    conference.status = 'active';
    conference.actualStartTime = new Date();

    const updatedConference = await this.conferenceRepository.save(conference);

    await this.auditService.logActivity(
      userId,
      'video_conference',
      'START_CONFERENCE',
      'Conference started',
      { conferenceId, status: 'active', actualStartTime: conference.actualStartTime }
    );

    return updatedConference;
  }

  async endConference(conferenceId: string, userId: string) {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    // Verify user is host
    if (conference.hostUserId !== userId) {
      throw new ForbiddenException('Only the host can end the conference');
    }

    if (conference.status !== 'active') {
      throw new ForbiddenException('Conference is not active');
    }

    conference.status = 'ended';
    conference.actualEndTime = new Date();
    conference.isRecordingActive = false;

    const updatedConference = await this.conferenceRepository.save(conference);

    // Update all active participants
    await this.participantRepository
      .createQueryBuilder()
      .update(VideoConferenceParticipant)
      .set({ leaveTime: new Date() })
      .where('conferenceId = :conferenceId AND leaveTime IS NULL', { conferenceId })
      .execute();

    await this.auditService.logActivity(
      userId,
      'video_conference',
      'END_CONFERENCE',
      'Conference ended',
      { conferenceId, status: 'ended', actualEndTime: conference.actualEndTime }
    );

    return updatedConference;
  }

  async joinConference(conferenceId: string, userId: string) {
    // Verify user is participant
    const participant = await this.verifyUserInConference(conferenceId, userId);

    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (conference.status !== 'active') {
      throw new ForbiddenException('Conference is not active');
    }

    // ENFORCEMENT: Check max participants
    const activeParticipantsCount = await this.participantRepository.count({
      where: {
        conferenceId,
        leaveTime: IsNull(),
        joinTime: Not(IsNull())
      }
    });

    if (activeParticipantsCount >= conference.maxParticipants) {
      throw new ForbiddenException(`Conference has reached its maximum capacity of ${conference.maxParticipants} participants`);
    }

    participant.joinTime = new Date();
    participant.invitationStatus = 'accepted';

    const updatedParticipant = await this.participantRepository.save(participant);

    await this.auditService.logActivity(
      userId,
      'video_conference_participant',
      'JOIN_CONFERENCE',
      'Participant joined conference',
      { participantId: participant.id, conferenceId, joinTime: participant.joinTime }
    );

    return updatedParticipant;
  }

  async leaveConference(conferenceId: string, userId: string) {
    const participant = await this.participantRepository.findOne({
      where: { conferenceId, userId, joinTime: Not(IsNull()) },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found or not joined');
    }

    participant.leaveTime = new Date();

    if (participant.joinTime) {
      const duration = Math.floor((participant.leaveTime.getTime() - participant.joinTime.getTime()) / (1000 * 60));
      participant.durationMinutes = duration;
    }

    const updatedParticipant = await this.participantRepository.save(participant);

    await this.auditService.logActivity(
      userId,
      'video_conference_participant',
      'LEAVE_CONFERENCE',
      'Participant left conference',
      { participantId: participant.id, conferenceId, leaveTime: participant.leaveTime, durationMinutes: participant.durationMinutes }
    );

    return updatedParticipant;
  }

  async toggleRecording(conferenceId: string, userId: string) {
    const conference = await this.conferenceRepository.findOne({
      where: { id: conferenceId },
    });

    if (!conference) {
      throw new NotFoundException('Conference not found');
    }

    // Verify user is host
    if (conference.hostUserId !== userId) {
      throw new ForbiddenException('Only the host can control recording');
    }

    if (!conference.isRecordingEnabled) {
      throw new ForbiddenException('Recording is not enabled for this conference');
    }

    conference.isRecordingActive = !conference.isRecordingActive;

    const updatedConference = await this.conferenceRepository.save(conference);

    await this.auditService.logActivity(
      userId,
      'video_conference',
      'TOGGLE_RECORDING',
      'Conference recording toggled',
      { conferenceId, isRecordingActive: conference.isRecordingActive }
    );

    return updatedConference;
  }

  async updateParticipantSettings(conferenceId: string, userId: string, settings: {
    isCameraEnabled?: boolean;
    isMicrophoneEnabled?: boolean;
    isScreenSharing?: boolean;
  }) {
    const participant = await this.participantRepository.findOne({
      where: { conferenceId, userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    Object.assign(participant, settings);

    const updatedParticipant = await this.participantRepository.save(participant);

    await this.auditService.logActivity(
      userId,
      'video_conference_participant',
      'UPDATE_SETTINGS',
      'Participant settings updated',
      { participantId: participant.id, conferenceId, settings }
    );

    return updatedParticipant;
  }

  async getConferenceRecordings(conferenceId: string, userId: string) {
    // Verify user is participant
    await this.verifyUserInConference(conferenceId, userId);

    return await this.recordingRepository.find({
      where: { conferenceId, isAvailable: true },
      order: { createdAt: 'DESC' },
    });
  }

  private async verifyUserInConference(conferenceId: string, userId: string): Promise<VideoConferenceParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { conferenceId, userId },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this conference');
    }

    return participant;
  }

  private async getConferenceWithDetails(conferenceId: string) {
    return await this.conferenceRepository.findOne({
      where: { id: conferenceId },
      relations: ['participants', 'recordings'],
    });
  }
}

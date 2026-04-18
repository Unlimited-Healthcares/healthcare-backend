import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { VideoConferencingService } from './services/video-conferencing.service';

interface ParticipantData {
  id: string;
  userId: string;
  conferenceId: string;
  role: 'host' | 'participant' | 'observer';
  isActive: boolean;
  joinedAt: Date;
  leftAt?: Date;
  permissions: {
    can_speak: boolean;
    can_video: boolean;
    can_screen_share: boolean;
    can_record: boolean;
    can_manage_participants: boolean;
  };
}

interface ConferenceData {
  id: string;
  conferenceId: string;
  title: string;
  type: string;
  hostUserId: string;
  status: string;
  maxParticipants: number;
  participants: ParticipantData[];
  settings: {
    isRecordingEnabled: boolean;
    waitingRoomEnabled: boolean;
    autoAdmitParticipants: boolean;
    muteParticipantsOnEntry: boolean;
  };
}

@WebSocketGateway(0, {
  namespace: '/video-conference',
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
})
export class VideoConferenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VideoConferenceGateway.name);
  private userSockets: Map<string, Socket[]> = new Map();
  private conferenceParticipants: Map<string, Set<string>> = new Map(); // conferenceId -> Set of participantIds

  constructor(private videoConferencingService: VideoConferencingService) { }

  handleConnection(client: Socket) {
    this.logger.log(`Video conference client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Video conference client disconnected: ${client.id}`);

    // Remove client from user mapping
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.findIndex(socket => socket.id === client.id);
      if (index > -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
        break;
      }
    }
  }

  @SubscribeMessage('authenticate')
  async handleAuthentication(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string; token: string }
  ) {
    try {
      // In a real implementation, verify the JWT token here
      const { userId } = data;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)!.push(client);

      client.join(`user_${userId}`);
      client.emit('authenticated', { success: true });

      this.logger.log(`User ${userId} authenticated with video conference socket ${client.id}`);
    } catch (error) {
      client.emit('authentication_error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  @SubscribeMessage('join_conference')
  async handleJoinConference(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string; password?: string }
  ) {
    try {
      const { conferenceId, userId } = data;

      // Verify user can join the conference
      const participant = await this.videoConferencingService.joinConference(conferenceId, userId);

      client.join(`conference_${conferenceId}`);

      if (!this.conferenceParticipants.has(conferenceId)) {
        this.conferenceParticipants.set(conferenceId, new Set());
      }
      this.conferenceParticipants.get(conferenceId)!.add(userId);

      // Notify all participants in the conference
      this.server.to(`conference_${conferenceId}`).emit('participant_joined', {
        conferenceId,
        participant: {
          id: participant.id,
          userId: participant.userId,
          role: participant.role,
          joinedAt: participant.joinTime,
          permissions: participant.participantMetadata?.permissions || [],
        },
      });

      client.emit('conference_joined', {
        conferenceId,
        success: true,
        participant: participant,
      });

      this.logger.log(`User ${userId} joined video conference: ${conferenceId}`);
    } catch (error) {
      client.emit('conference_join_error', {
        conferenceId: data.conferenceId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('leave_conference')
  async handleLeaveConference(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string }
  ) {
    const { conferenceId, userId } = data;

    try {
      await this.videoConferencingService.leaveConference(conferenceId, userId);

      client.leave(`conference_${conferenceId}`);

      if (this.conferenceParticipants.has(conferenceId)) {
        this.conferenceParticipants.get(conferenceId)!.delete(userId);
        if (this.conferenceParticipants.get(conferenceId)!.size === 0) {
          this.conferenceParticipants.delete(conferenceId);
        }
      }

      // Notify all participants in the conference
      this.server.to(`conference_${conferenceId}`).emit('participant_left', {
        conferenceId,
        userId,
        leftAt: new Date(),
      });

      client.emit('conference_left', { conferenceId, success: true });
      this.logger.log(`User ${userId} left video conference: ${conferenceId}`);
    } catch (error) {
      client.emit('conference_leave_error', {
        conferenceId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('start_conference')
  async handleStartConference(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string }
  ) {
    try {
      const { conferenceId, userId } = data;

      const conference = await this.videoConferencingService.startConference(conferenceId, userId);

      this.server.to(`conference_${conferenceId}`).emit('conference_started', {
        conferenceId,
        startedAt: new Date(),
        host: {
          userId: conference.hostUserId,
          role: 'host',
        },
      });

      client.emit('conference_start_success', { conferenceId, success: true });
      this.logger.log(`Conference ${conferenceId} started by user ${userId}`);
    } catch (error) {
      client.emit('conference_start_error', {
        conferenceId: data.conferenceId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('end_conference')
  async handleEndConference(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string }
  ) {
    try {
      const { conferenceId, userId } = data;

      await this.videoConferencingService.endConference(conferenceId, userId);

      this.server.to(`conference_${conferenceId}`).emit('conference_ended', {
        conferenceId,
        endedAt: new Date(),
        endedBy: userId,
      });

      // Disconnect all participants
      this.server.in(`conference_${conferenceId}`).emit('conference_ended', { conferenceId });

      client.emit('conference_end_success', { conferenceId, success: true });
      this.logger.log(`Conference ${conferenceId} ended by user ${userId}`);
    } catch (error) {
      client.emit('conference_end_error', {
        conferenceId: data.conferenceId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('toggle_mute')
  async handleToggleMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string; isMuted: boolean }
  ) {
    const { conferenceId, userId, isMuted } = data;

    this.server.to(`conference_${conferenceId}`).emit('participant_mute_changed', {
      conferenceId,
      userId,
      isMuted,
      timestamp: new Date(),
    });

    client.emit('mute_toggle_success', { isMuted, success: true });
  }

  @SubscribeMessage('toggle_video')
  async handleToggleVideo(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string; isVideoEnabled: boolean }
  ) {
    const { conferenceId, userId, isVideoEnabled } = data;

    this.server.to(`conference_${conferenceId}`).emit('participant_video_changed', {
      conferenceId,
      userId,
      isVideoEnabled,
      timestamp: new Date(),
    });

    client.emit('video_toggle_success', { isVideoEnabled, success: true });
  }

  @SubscribeMessage('screen_share_start')
  async handleScreenShareStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string }
  ) {
    const { conferenceId, userId } = data;

    this.server.to(`conference_${conferenceId}`).emit('screen_share_started', {
      conferenceId,
      userId,
      startedAt: new Date(),
    });

    client.emit('screen_share_start_success', { success: true });
  }

  @SubscribeMessage('screen_share_stop')
  async handleScreenShareStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string }
  ) {
    const { conferenceId, userId } = data;

    this.server.to(`conference_${conferenceId}`).emit('screen_share_stopped', {
      conferenceId,
      userId,
      stoppedAt: new Date(),
    });

    client.emit('screen_share_stop_success', { success: true });
  }

  @SubscribeMessage('raise_hand')
  async handleRaiseHand(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string; isRaised: boolean }
  ) {
    const { conferenceId, userId, isRaised } = data;

    this.server.to(`conference_${conferenceId}`).emit('hand_raised', {
      conferenceId,
      userId,
      isRaised,
      timestamp: new Date(),
    });

    client.emit('hand_raise_success', { isRaised, success: true });
  }

  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string; message: string; messageType?: string }
  ) {
    const { conferenceId, userId, message, messageType = 'text' } = data;

    this.server.to(`conference_${conferenceId}`).emit('chat_message', {
      conferenceId,
      userId,
      message,
      messageType,
      timestamp: new Date(),
    });

    client.emit('chat_message_sent', { success: true });
  }

  @SubscribeMessage('recording_start')
  async handleRecordingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string }
  ) {
    try {
      const { conferenceId, userId } = data;

      const recording = await this.videoConferencingService.toggleRecording(conferenceId, userId);

      this.server.to(`conference_${conferenceId}`).emit('recording_started', {
        conferenceId,
        startedBy: userId,
        startedAt: new Date(),
        recordingId: recording.id,
      });

      client.emit('recording_start_success', { success: true });
    } catch (error) {
      client.emit('recording_start_error', {
        conferenceId: data.conferenceId,
        message: error.message
      });
    }
  }

  @SubscribeMessage('recording_stop')
  async handleRecordingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conferenceId: string; userId: string }
  ) {
    try {
      const { conferenceId, userId } = data;

      const recording = await this.videoConferencingService.toggleRecording(conferenceId, userId);

      this.server.to(`conference_${conferenceId}`).emit('recording_stopped', {
        conferenceId,
        stoppedBy: userId,
        stoppedAt: new Date(),
        recordingId: recording.id,
        recordingUrl: recording.recordingUrl,
      });

      client.emit('recording_stop_success', { success: true });
    } catch (error) {
      client.emit('recording_stop_error', {
        conferenceId: data.conferenceId,
        message: error.message
      });
    }
  }

  // Send notification to specific conference
  async sendToConference(conferenceId: string, event: string, data: unknown) {
    this.server.to(`conference_${conferenceId}`).emit(event, data);
  }

  // Send system message to conference
  async sendSystemMessage(conferenceId: string, message: string, metadata?: Record<string, unknown>) {
    this.server.to(`conference_${conferenceId}`).emit('system_message', {
      conferenceId,
      message,
      timestamp: new Date(),
      metadata,
    });
  }

  // Notify user about conference updates
  async notifyConferenceUpdate(userId: string, conferenceData: ConferenceData) {
    this.server.to(`user_${userId}`).emit('conference_updated', conferenceData);
  }

  // Notify user about new conference invitation
  async notifyConferenceInvitation(userId: string, invitationData: {
    conferenceId: string;
    title: string;
    hostName: string;
    scheduledTime: Date;
  }) {
    this.server.to(`user_${userId}`).emit('conference_invitation', invitationData);
  }
} 
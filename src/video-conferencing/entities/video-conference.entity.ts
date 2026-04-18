import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { VideoConferenceParticipant } from './video-conference-participant.entity';
import { VideoConferenceRecording } from './video-conference-recording.entity';

interface ConferenceSettings {
  maxDuration?: number;
  allowRecording?: boolean;
  allowScreenShare?: boolean;
  allowChat?: boolean;
  moderationEnabled?: boolean;
  breakoutRoomsEnabled?: boolean;
  customSettings?: Record<string, string | number | boolean>;
}

interface ProviderSettings {
  apiKey?: string;
  meetingType?: string;
  securitySettings?: Record<string, boolean>;
  features?: string[];
  customConfig?: Record<string, string | number | boolean>;
}

@Entity('video_conferences')
export class VideoConference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  conferenceId: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 50, default: 'consultation' })
  type: 'consultation' | 'meeting' | 'emergency' | 'group_session' | 'training';

  @Column({ type: 'uuid', nullable: true })
  appointmentId: string;

  @Column({ type: 'uuid', nullable: true })
  chatRoomId: string;

  @Column({ type: 'uuid' })
  hostUserId: string;

  @Column({ type: 'uuid', nullable: true })
  centerId: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledStartTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledEndTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualStartTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  actualEndTime: Date;

  @Column({ type: 'varchar', length: 20, default: 'scheduled' })
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';

  @Column({ type: 'integer', default: 10 })
  maxParticipants: number;

  @Column({ type: 'boolean', default: false })
  isRecordingEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  isRecordingActive: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  recordingUrl: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  meetingPassword: string;

  @Column({ type: 'boolean', default: true })
  waitingRoomEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  autoAdmitParticipants: boolean;

  @Column({ type: 'boolean', default: false })
  muteParticipantsOnEntry: boolean;

  @Column({ type: 'jsonb', default: {} })
  conferenceSettings: ConferenceSettings;

  @Column({ type: 'varchar', length: 50, default: 'internal' })
  provider: 'internal' | 'zoom' | 'teams' | 'webrtc';

  @Column({ type: 'varchar', length: 200, nullable: true })
  providerMeetingId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  providerJoinUrl: string;

  @Column({ type: 'jsonb', default: {} })
  providerSettings: ProviderSettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => VideoConferenceParticipant, participant => participant.conference)
  participants: VideoConferenceParticipant[];

  @OneToMany(() => VideoConferenceRecording, recording => recording.conference)
  recordings: VideoConferenceRecording[];
}

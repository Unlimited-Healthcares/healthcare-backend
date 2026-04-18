import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { VideoConference } from './video-conference.entity';

interface ParticipantMetadata {
  deviceType?: string;
  browserInfo?: string;
  networkInfo?: string;
  permissions?: string[];
  preferences?: Record<string, string | number | boolean>;
}

@Entity('video_conference_participants')
@Unique(['conferenceId', 'userId'])
export class VideoConferenceParticipant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conferenceId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 50, default: 'participant' })
  role: 'host' | 'co_host' | 'participant' | 'observer';

  @Column({ type: 'varchar', length: 20, default: 'invited' })
  invitationStatus: 'invited' | 'accepted' | 'declined' | 'pending';

  @Column({ type: 'timestamptz', nullable: true })
  joinTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  leaveTime: Date;

  @Column({ type: 'integer', nullable: true })
  durationMinutes: number;

  @Column({ type: 'boolean', default: true })
  isCameraEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  isMicrophoneEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  isScreenSharing: boolean;

  @Column({ type: 'varchar', length: 20, default: 'unknown' })
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

  @Column({ type: 'jsonb', default: {} })
  participantMetadata: ParticipantMetadata;

  @CreateDateColumn()
  invitedAt: Date;

  @ManyToOne(() => VideoConference, conference => conference.participants)
  @JoinColumn({ name: 'conferenceId' })
  conference: VideoConference;
}

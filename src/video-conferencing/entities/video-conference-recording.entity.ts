
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { VideoConference } from './video-conference.entity';

@Entity('video_conference_recordings')
export class VideoConferenceRecording {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conferenceId: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  recordingName: string;

  @Column({ type: 'varchar', length: 500 })
  recordingUrl: string;

  @Column({ type: 'bigint', nullable: true })
  fileSize: number;

  @Column({ type: 'integer', nullable: true })
  durationMinutes: number;

  @Column({ type: 'varchar', length: 50, default: 'full' })
  recordingType: 'full' | 'audio_only' | 'screen_share';

  @Column({ type: 'varchar', length: 20, default: 'standard' })
  recordingQuality: 'low' | 'standard' | 'high' | 'hd';

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'varchar', length: 20, default: 'participants' })
  accessLevel: 'public' | 'participants' | 'restricted' | 'private';

  @Column({ type: 'integer', default: 0 })
  downloadCount: number;

  @Column({ type: 'integer', default: 365 })
  retentionDays: number;

  @Column({ type: 'date', nullable: true })
  autoDeleteDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => VideoConference, conference => conference.recordings)
  @JoinColumn({ name: 'conferenceId' })
  conference: VideoConference;
}

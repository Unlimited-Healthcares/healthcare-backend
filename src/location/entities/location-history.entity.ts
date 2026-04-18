import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { User } from '../../users/entities/user.entity';

@Entity('location_history')
@Index(['entityType', 'entityId'])
@Index(['latitude', 'longitude'])
@Index(['timestamp'])
export class LocationHistory {
  @ApiProperty({ description: 'Unique identifier for the location history record' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Type of entity (center, user, etc.)' })
  @Column()
  entityType: string; // 'center', 'user', 'ambulance', etc.

  @ApiProperty({ description: 'ID of the entity whose location is being tracked' })
  @Column()
  entityId: string;

  @ApiProperty({ description: 'Latitude coordinate' })
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @ApiProperty({ description: 'Longitude coordinate' })
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @ApiProperty({ description: 'Location accuracy in meters', required: false })
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  accuracy: number;

  @ApiProperty({ description: 'Source of the location data' })
  @Column({ default: 'manual' })
  source: string; // 'gps', 'network', 'manual', 'geocoded'

  @ApiProperty({ description: 'Previous address before update', required: false })
  @Column({ type: 'text', nullable: true })
  previousAddress: string;

  @ApiProperty({ description: 'New address after update', required: false })
  @Column({ type: 'text', nullable: true })
  newAddress: string;

  @ApiProperty({ description: 'User who made the location update', required: false })
  @Column({ nullable: true })
  updatedBy: string;

  @ApiProperty({ description: 'Reason for location update', required: false })
  @Column({ nullable: true })
  updateReason: string;

  @ApiProperty({ 
    description: 'Additional metadata about the location update',
    required: false,
    type: 'object'
  })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @ApiProperty({ description: 'Timestamp when the location was recorded' })
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => HealthcareCenter, { nullable: true })
  @JoinColumn({ name: 'entityId' })
  center?: HealthcareCenter;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser?: User;
} 
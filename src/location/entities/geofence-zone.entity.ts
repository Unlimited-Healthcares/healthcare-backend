import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { User } from '../../users/entities/user.entity';
import { GeofenceStatus } from '../../types/location.types';

@Entity('geofence_zones')
@Index(['centerId'])
@Index(['centerLatitude', 'centerLongitude'])
@Index(['status'])
export class GeofenceZone {
  @ApiProperty({ description: 'Unique identifier for the geofence zone' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Name of the geofence zone' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ description: 'Description of the geofence zone', required: false })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Center latitude coordinate' })
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  centerLatitude: number;

  @ApiProperty({ description: 'Center longitude coordinate' })
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  centerLongitude: number;

  @ApiProperty({ description: 'Geofence radius in meters' })
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  radius: number;

  @ApiProperty({ description: 'Healthcare center ID this geofence belongs to', required: false })
  @Column({ nullable: true })
  centerId?: string;

  @ApiProperty({ 
    description: 'Status of the geofence zone',
    enum: GeofenceStatus,
    default: GeofenceStatus.ACTIVE
  })
  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: GeofenceStatus.ACTIVE 
  })
  status: GeofenceStatus;

  @ApiProperty({ description: 'User who created the geofence' })
  @Column()
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => HealthcareCenter, { nullable: true })
  @JoinColumn({ name: 'centerId' })
  center?: HealthcareCenter;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  createdByUser: User;
} 
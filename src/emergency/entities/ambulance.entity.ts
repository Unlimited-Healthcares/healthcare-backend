
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AmbulanceRequest } from './ambulance-request.entity';

export enum AmbulanceStatus {
  AVAILABLE = 'available',
  DISPATCHED = 'dispatched',
  EN_ROUTE = 'en_route',
  ON_SCENE = 'on_scene',
  TRANSPORTING = 'transporting',
  AT_HOSPITAL = 'at_hospital',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum AmbulanceType {
  BASIC = 'basic',
  ADVANCED = 'advanced',
  CRITICAL_CARE = 'critical_care',
  NEONATAL = 'neonatal',
}

@Entity('ambulances')
export class Ambulance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'vehicle_number', unique: true, nullable: true })
  vehicleNumber: string;

  @Column({ name: 'license_plate', unique: true, nullable: true })
  licensePlate: string;

  @Column({
    type: 'enum',
    enum: AmbulanceType,
    default: AmbulanceType.BASIC,
  })
  type: AmbulanceType;

  @Column({
    type: 'enum',
    enum: AmbulanceStatus,
    default: AmbulanceStatus.AVAILABLE,
  })
  status: AmbulanceStatus;

  @Column({ name: 'current_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  currentLatitude: number;

  @Column({ name: 'current_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  currentLongitude: number;

  @Column({ name: 'last_location_update', nullable: true })
  lastLocationUpdate: Date;

  @Column({ name: 'crew_members', type: 'jsonb', nullable: true })
  crewMembers: {
    paramedic?: string;
    emt?: string;
    driver?: string;
    additional?: string[];
  };

  @Column({ name: 'equipment_list', type: 'jsonb', nullable: true })
  equipmentList: string[];

  @Column({ name: 'base_station_id', nullable: true })
  baseStationId: string;

  @Column({ name: 'contact_number', nullable: true })
  contactNumber: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_maintenance', nullable: true })
  lastMaintenance: Date;

  @Column({ name: 'next_maintenance', nullable: true })
  nextMaintenance: Date;

  @OneToMany(() => AmbulanceRequest, (request) => request.ambulance)
  requests: AmbulanceRequest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

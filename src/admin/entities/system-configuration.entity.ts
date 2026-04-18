import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { JsonValue } from '../../types/common';

export enum ConfigType {
  FEATURE_FLAG = 'feature_flag',
  SYSTEM_SETTING = 'system_setting',
  MAINTENANCE = 'maintenance',
  NOTIFICATION = 'notification',
}

@Entity('system_configurations')
export class SystemConfiguration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'config_key', unique: true })
  configKey: string;

  @Column({ type: 'jsonb', name: 'config_value' })
  configValue: JsonValue;

  @Column({ 
    type: 'enum', 
    enum: ConfigType,
    name: 'config_type' 
  })
  configType: ConfigType;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'created_by' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

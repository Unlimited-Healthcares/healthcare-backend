
import { Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_settings')
export class UserSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({ default: true })
  notificationEmail: boolean;

  @Column({ default: false })
  notificationSms: boolean;

  @Column({ default: true })
  notificationPush: boolean;

  @Column({ default: 'English' })
  languagePreference: string;

  @Column({ default: 'UTC' })
  timezone: string;

  @Column({ default: 'light' })
  themePreference: string; // light, dark, auto

  @Column({ default: 'standard' })
  privacyLevel: string; // minimal, standard, full

  @Column({ default: false })
  dataSharingConsent: boolean;

  @Column({ default: false })
  marketingConsent: boolean;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

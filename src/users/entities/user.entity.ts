import { Column, Entity, OneToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Profile } from './profile.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  displayId: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column('simple-array')
  roles: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: ['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NOT_STARTED',
  })
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({
    type: 'enum',
    enum: ['NOT_STARTED', 'PENDING', 'APPROVED', 'REJECTED'],
    default: 'NOT_STARTED',
  })
  professionalStatus: 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({ type: 'date', nullable: true })
  licenseExpiryDate: Date;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  // Email verification fields
  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  emailVerificationToken: string;

  @Column({ nullable: true })
  emailVerificationTokenExpiry: Date;

  @Column({ nullable: true })
  lastVerificationSentAt: Date;

  // Password reset fields
  @Column({ nullable: true })
  @Exclude()
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetTokenExpiry: Date;

  @Column({ nullable: true })
  lastPasswordResetSentAt: Date;

  // Security & Lockout fields
  @Column({ default: 0 })
  loginAttempts: number;

  @Column({ nullable: true, type: 'timestamp' })
  lockoutUntil: Date;

  @OneToOne(() => Profile, profile => profile.user, { cascade: true })
  profile: Profile;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

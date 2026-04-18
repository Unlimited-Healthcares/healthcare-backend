import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TriageLevel {
  SELF_CARE = 'self_care',
  GP_CONSULT = 'gp_consult',
  URGENT_CLINIC = 'urgent_clinic',
  EMERGENCY = 'emergency',
}

export enum SessionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned',
}

@Entity('symptom_sessions')
export class SymptomSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'jsonb', default: [] })
  messages: Array<{ role: 'user' | 'model'; parts: string; timestamp: string }>;

  @Column({ type: 'jsonb', nullable: true })
  triageResult: {
    triageLevel: TriageLevel;
    possibleConditions: Array<{ name: string; likelihood: string; description: string }>;
    recommendedSpecialist?: string;
    recommendedActions: string[];
    redFlags: string[];
    disclaimer: string;
  };

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.ACTIVE,
  })
  status: SessionStatus;

  @Column({ type: 'jsonb', nullable: true })
  patientContext: {
    age?: string;
    sex?: string;
    existingConditions?: string[];
    currentMedications?: string[];
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../../users/entities/user.entity';
import { ClinicalWorkspace } from './clinical-workspace.entity';

@Entity('clinical_logs')
export class ClinicalLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  workspaceId: string;

  @Column({ type: 'uuid' })
  authorId: string;

  @Column({ type: 'varchar', length: 50 })
  authorRole: string; // Doctor, Nurse, Surgeon, etc.

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isSystemGenerated: boolean;

  @CreateDateColumn({ name: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => ClinicalWorkspace, workspace => workspace.logs)
  @JoinColumn({ name: 'workspace_id' })
  workspace: ClinicalWorkspace;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;
}

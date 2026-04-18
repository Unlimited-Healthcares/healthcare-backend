
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';

@Entity('medical_record_categories')
export class MedicalRecordCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  parentCategoryId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ length: 100, nullable: true })
  icon: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => MedicalRecordCategory, category => category.children)
  @JoinColumn({ name: 'parentCategoryId' })
  parent: MedicalRecordCategory;

  @OneToMany(() => MedicalRecordCategory, category => category.parent)
  children: MedicalRecordCategory[];
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { JsonObject } from '../../types/common';

@Entity('center_performance_metrics')
export class CenterPerformanceMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'center_id' })
  centerId: string;

  @Column({ name: 'metric_period', type: 'date' })
  metricPeriod: Date;

  @Column({ name: 'total_appointments', default: 0 })
  totalAppointments: number;

  @Column({ name: 'completed_appointments', default: 0 })
  completedAppointments: number;

  @Column({ name: 'cancelled_appointments', default: 0 })
  cancelledAppointments: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating: number;

  @Column({ name: 'total_reviews', default: 0 })
  totalReviews: number;

  @Column({ name: 'response_time_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
  responseTimeHours: number;

  @Column({ name: 'patient_satisfaction_score', type: 'decimal', precision: 3, scale: 2, nullable: true })
  patientSatisfactionScore: number;

  @Column({ name: 'compliance_score', nullable: true })
  complianceScore: number;

  @Column({ name: 'revenue_generated', type: 'decimal', precision: 12, scale: 2, nullable: true })
  revenueGenerated: number;

  @Column({ name: 'staff_utilization_rate', type: 'decimal', precision: 5, scale: 2, nullable: true })
  staffUtilizationRate: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: JsonObject;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

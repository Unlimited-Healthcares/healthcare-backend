import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RehabPlan } from './entities/rehab-plan.entity';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class RehabService {
    constructor(
        @InjectRepository(RehabPlan)
        private readonly rehabRepository: Repository<RehabPlan>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(data: any, physioId: string): Promise<RehabPlan> {
        const plan = this.rehabRepository.create({
            ...data,
            physioId,
            status: 'active'
        });
        const saved = await this.rehabRepository.save(plan) as any;

        // Notify patient about new rehab plan
        try {
            const p = await this.rehabRepository.findOne({
                where: { id: saved.id },
                relations: ['patient']
            });
            if (p?.patient?.userId) {
                await this.notificationsService.createNotification({
                    userId: p.patient.userId,
                    type: 'care_plan',
                    title: 'New Rehabilitation Plan Assigned',
                    message: `Your physiotherapist has assigned a new exercise program: ${saved.title}`,
                    data: { planId: saved.id },
                });
            }
        } catch (error) {
            console.error('Failed to notify patient about rehab plan:', error);
        }

        return saved;
    }

    async findAll(filters: { patientId?: string; physioId?: string }): Promise<RehabPlan[]> {
        return this.rehabRepository.find({
            where: filters,
            relations: ['patient', 'physio'],
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<RehabPlan> {
        const plan = await this.rehabRepository.findOne({
            where: { id },
            relations: ['patient', 'physio']
        });
        if (!plan) throw new NotFoundException('Rehab plan not found');
        return plan;
    }

    async logProgress(id: string, log: { exerciseName: string; completed: boolean; notes?: string }): Promise<RehabPlan> {
        const plan = await this.findOne(id);
        if (!plan.completionLogs) plan.completionLogs = [];
        
        plan.completionLogs.push({
            ...log,
            date: new Date().toISOString()
        });

        return this.rehabRepository.save(plan);
    }

    async saveAssessment(data: any, authorId: string): Promise<any> {
        // In a real scenario, this would save to a PhysioAssessment entity
        // For now, we return the saved data to simulate persistence
        return {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            authorId,
            timestamp: new Date().toISOString()
        };
    }
}

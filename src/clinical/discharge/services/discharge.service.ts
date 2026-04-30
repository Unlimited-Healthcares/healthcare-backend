import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DischargePlan } from './entities/discharge-plan.entity';
import { CareTask } from '../../../care-tasks/entities/care-task.entity';
import { NotificationsService } from '../../../notifications/notifications.service';

@Injectable()
export class DischargeService {
    constructor(
        @InjectRepository(DischargePlan)
        private readonly planRepository: Repository<DischargePlan>,
        @InjectRepository(CareTask)
        private readonly taskRepository: Repository<CareTask>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async createPlan(data: any, doctorId: string): Promise<DischargePlan> {
        const plan = this.planRepository.create({
            ...data,
            doctorId,
            status: 'active'
        });
        const savedPlan = await this.planRepository.save(plan);

        // Create Nurse Tasks
        const tasks = [
            { title: 'Counsel patient on warning signs', description: 'Discuss red flags and when to return to ER' },
            { title: 'Confirm understanding of meds', description: 'Verify patient knows how and when to take new prescriptions' },
            { title: 'Finalize Discharge Paperwork', description: 'Ensure all signatures are collected' }
        ];

        for (const taskData of tasks) {
            const task = this.taskRepository.create({
                patientId: savedPlan.patientId,
                createdBy: doctorId,
                title: `[Discharge] ${taskData.title}`,
                description: taskData.description,
                priority: 'high',
                status: 'pending',
                metadata: { dischargePlanId: savedPlan.id }
            });
            await this.taskRepository.save(task);
        }

        // Notify Nursing Team
        await this.notificationsService.broadcast({
            title: '🆕 NEW DISCHARGE PLAN',
            message: `Discharge tasks generated for patient ${savedPlan.patientId}`,
            type: 'task',
            isUrgent: true,
            data: { planId: savedPlan.id }
        }, { roles: ['nurse'] });

        return savedPlan;
    }

    async getPlans(filters: any): Promise<DischargePlan[]> {
        return this.planRepository.find({
            where: filters,
            relations: ['patient', 'doctor', 'encounter'],
            order: { createdAt: 'DESC' }
        });
    }

    async getPlanById(id: string): Promise<DischargePlan> {
        const plan = await this.planRepository.findOne({
            where: { id },
            relations: ['patient', 'doctor', 'encounter']
        });
        if (!plan) throw new NotFoundException('Discharge plan not found');
        return plan;
    }
}

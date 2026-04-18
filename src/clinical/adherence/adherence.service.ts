import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { MedicationAdherence } from './entities/medication-adherence.entity';
import { CreateAdherenceDto } from './dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AdherenceService {
    constructor(
        @InjectRepository(MedicationAdherence)
        private readonly adherenceRepository: Repository<MedicationAdherence>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(createAdherenceDto: CreateAdherenceDto): Promise<MedicationAdherence> {
        const adherence = (this.adherenceRepository.create({
            ...createAdherenceDto,
            status: 'pending',
        }) as unknown) as MedicationAdherence;
        return this.adherenceRepository.save(adherence);
    }

    async markAsTaken(id: string): Promise<MedicationAdherence> {
        const adherence = await this.adherenceRepository.findOne({ where: { id } });
        if (!adherence) throw new NotFoundException('Adherence record not found');
        adherence.status = 'taken';
        adherence.takenAt = new Date();
        return this.adherenceRepository.save(adherence);
    }

    async getPatientSchedule(patientId: string, date: Date): Promise<MedicationAdherence[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.adherenceRepository.find({
            where: {
                patientId,
                scheduledTime: MoreThanOrEqual(startOfDay),
                // scheduledTime: LessThanOrEqual(endOfDay), // TypeORM syntax needs both sometimes
            },
            order: { scheduledTime: 'ASC' },
        });
    }

    @Cron(CronExpression.EVERY_HOUR)
    async sendMedicationReminders() {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        const pending = await this.adherenceRepository.find({
            where: {
                status: 'pending',
                scheduledTime: LessThanOrEqual(oneHourFromNow),
            },
            relations: ['patient'],
        });

        for (const record of pending) {
            if (record.patient?.userId) {
                await this.notificationsService.createNotification({
                    userId: record.patient.userId,
                    type: 'reminder',
                    title: 'Medication Reminder',
                    message: `It's time to take your medication: ${record.medicationName}.`,
                    data: { adherenceId: record.id },
                });
            }
        }
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Encounter } from './entities/encounter.entity';
import { HealthcareCenter } from '../../centers/entities/center.entity';
import { CreateEncounterDto, UpdateEncounterDto } from './dto';
import { PatientsService } from '../../patients/patients.service';

@Injectable()
export class EncountersService {
    constructor(
        @InjectRepository(Encounter)
        private readonly encounterRepository: Repository<Encounter>,
        @InjectRepository(HealthcareCenter)
        private readonly centerRepository: Repository<HealthcareCenter>,
        private readonly patientsService: PatientsService,
    ) { }

    async create(createEncounterDto: CreateEncounterDto, providerId: string): Promise<Encounter> {
        // Resolve patient ID to ensure it's a Patient record UUID, not a User UUID
        const patientId = await this.patientsService.resolvePatientId(createEncounterDto.patientId);

        // Verify center exists if provided to prevent FK violation
        if (createEncounterDto.centerId) {
            const centerExists = await this.centerRepository.findOne({ where: { id: createEncounterDto.centerId } });
            if (!centerExists) {
                // If the center ID is invalid, we'll null it out if possible or throw an error
                // In this case, we'll throw to be safe
                throw new NotFoundException(`Healthcare Center with ID ${createEncounterDto.centerId} not found`);
            }
        }

        const encounter = (this.encounterRepository.create({
            ...createEncounterDto,
            patientId,
            providerId,
            startTime: new Date(),
            status: 'in-progress',
        }) as unknown) as Encounter;
        return this.encounterRepository.save(encounter);
    }

    async findAll(filters: { patientId?: string; providerId?: string; centerId?: string }): Promise<Encounter[]> {
        const where: FindOptionsWhere<Encounter> = {};
        if (filters.patientId) where.patientId = filters.patientId;
        if (filters.providerId) where.providerId = filters.providerId;
        if (filters.centerId) where.centerId = filters.centerId;

        return this.encounterRepository.find({
            where,
            relations: ['patient', 'provider', 'center', 'appointment'],
            order: { startTime: 'DESC' },
        });
    }

    async findOne(id: string): Promise<Encounter> {
        const encounter = await this.encounterRepository.findOne({
            where: { id },
            relations: ['patient', 'provider', 'center', 'appointment'],
        });
        if (!encounter) {
            throw new NotFoundException(`Encounter with ID ${id} not found`);
        }
        return encounter;
    }

    async update(id: string, updateEncounterDto: UpdateEncounterDto): Promise<Encounter> {
        const encounter = await this.findOne(id);
        Object.assign(encounter, updateEncounterDto);
        if (updateEncounterDto.status === 'completed' && !encounter.endTime) {
            encounter.endTime = new Date();
        }
        return this.encounterRepository.save(encounter);
    }

    async complete(id: string): Promise<Encounter> {
        const encounter = await this.findOne(id);
        encounter.status = 'completed';
        encounter.endTime = new Date();
        return this.encounterRepository.save(encounter);
    }
}

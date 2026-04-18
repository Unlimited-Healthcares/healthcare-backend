import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MortuaryRecord } from './entities/mortuary-record.entity';
import { CreateMortuaryRecordDto, UpdateMortuaryRecordDto } from './dto/mortuary-record.dto';

@Injectable()
export class MortuaryService {
    constructor(
        @InjectRepository(MortuaryRecord)
        private readonly mortuaryRepository: Repository<MortuaryRecord>,
    ) { }

    async create(createDto: CreateMortuaryRecordDto): Promise<MortuaryRecord> {
        const record = this.mortuaryRepository.create(createDto);
        return await this.mortuaryRepository.save(record);
    }

    async findAll(centerId: string): Promise<MortuaryRecord[]> {
        return await this.mortuaryRepository.find({
            where: { centerId },
            order: { intakeDate: 'DESC' },
        });
    }

    async findOne(id: string): Promise<MortuaryRecord> {
        const record = await this.mortuaryRepository.findOne({ where: { id } });
        if (!record) {
            throw new NotFoundException(`Mortuary record with ID ${id} not found`);
        }
        return record;
    }

    async update(id: string, updateDto: UpdateMortuaryRecordDto): Promise<MortuaryRecord> {
        const record = await this.findOne(id);
        Object.assign(record, updateDto);
        return await this.mortuaryRepository.save(record);
    }

    async remove(id: string): Promise<void> {
        const record = await this.findOne(id);
        await this.mortuaryRepository.remove(record);
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CareTask } from './entities/care-task.entity';
import { CreateCareTaskDto, UpdateCareTaskDto } from './dto/care-task.dto';

@Injectable()
export class CareTasksService {
  constructor(
    @InjectRepository(CareTask)
    private readonly careTaskRepository: Repository<CareTask>,
  ) {}

  async create(createCareTaskDto: CreateCareTaskDto, createdBy: string): Promise<CareTask> {
    const task = this.careTaskRepository.create({
      ...createCareTaskDto,
      createdBy,
    });
    return this.careTaskRepository.save(task);
  }

  async findAll(filters: { patientId?: string; assignedToId?: string; status?: string }): Promise<CareTask[]> {
    const where: any = {};
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters.status) where.status = filters.status;

    return this.careTaskRepository.find({
      where,
      relations: ['patient', 'assignedTo'],
      order: { dueAt: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<CareTask> {
    const task = await this.careTaskRepository.findOne({
      where: { id },
      relations: ['patient', 'assignedTo'],
    });
    if (!task) {
      throw new NotFoundException(`Care task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateCareTaskDto: UpdateCareTaskDto): Promise<CareTask> {
    const task = await this.findOne(id);
    Object.assign(task, updateCareTaskDto);
    return this.careTaskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.careTaskRepository.remove(task);
  }
}

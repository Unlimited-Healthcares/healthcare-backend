import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';
import { MaintenanceTicket, TicketStatus } from './entities/maintenance-ticket.entity';

@Injectable()
export class BiotechService {
    constructor(
        @InjectRepository(Equipment)
        private readonly equipmentRepository: Repository<Equipment>,
        @InjectRepository(MaintenanceTicket)
        private readonly ticketRepository: Repository<MaintenanceTicket>,
    ) { }

    async findAllEquipment(centerId: string): Promise<Equipment[]> {
        return await this.equipmentRepository.find({
            where: { centerId },
            order: { name: 'ASC' }
        });
    }

    async findEquipmentById(id: string): Promise<Equipment> {
        const device = await this.equipmentRepository.findOne({ where: { id } });
        if (!device) throw new NotFoundException('Equipment not found');
        return device;
    }

    async updateEquipmentStatus(id: string, status: EquipmentStatus, metadata?: any): Promise<Equipment> {
        const device = await this.findEquipmentById(id);
        device.status = status;
        if (metadata) {
            device.metadata = { ...device.metadata, ...metadata };
        }
        return await this.equipmentRepository.save(device);
    }

    async createTicket(ticketData: Partial<MaintenanceTicket>): Promise<MaintenanceTicket> {
        const ticketNumber = `TKT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const ticket = this.ticketRepository.create({
            ...ticketData,
            ticketNumber,
            status: TicketStatus.PENDING
        });
        return await this.ticketRepository.save(ticket);
    }

    async findAllTickets(centerId: string): Promise<MaintenanceTicket[]> {
        return await this.ticketRepository.find({
            where: { equipment: { centerId } },
            relations: ['equipment', 'reporter', 'assignedEngineer'],
            order: { createdAt: 'DESC' }
        });
    }

    async updateTicketStatus(id: string, status: TicketStatus, notes?: string): Promise<MaintenanceTicket> {
        const ticket = await this.ticketRepository.findOne({ where: { id } });
        if (!ticket) throw new NotFoundException('Ticket not found');
        
        ticket.status = status;
        if (notes) ticket.resolutionNotes = notes;
        
        return await this.ticketRepository.save(ticket);
    }
}

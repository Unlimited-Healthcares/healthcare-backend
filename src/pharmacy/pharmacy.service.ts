import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PharmacyInventory } from './entities/inventory.entity';

@Injectable()
export class PharmacyService {
    constructor(
        @InjectRepository(PharmacyInventory)
        private readonly inventoryRepository: Repository<PharmacyInventory>,
    ) { }

    async findAll(centerId?: string): Promise<PharmacyInventory[]> {
        const query = this.inventoryRepository.createQueryBuilder('inventory');
        if (centerId) {
            query.where('inventory.centerId = :centerId', { centerId });
        }
        return await query.orderBy('inventory.name', 'ASC').getMany();
    }

    async findOne(id: string): Promise<PharmacyInventory> {
        const item = await this.inventoryRepository.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Inventory item not found');
        return item;
    }

    async updateStock(id: string, adjustment: number): Promise<PharmacyInventory> {
        const item = await this.findOne(id);
        item.stockLevel += adjustment;
        
        if (item.stockLevel <= 0) {
            item.stockLevel = 0;
            item.status = 'out_of_stock';
        } else if (item.stockLevel < item.minThreshold) {
            item.status = 'low';
        } else {
            item.status = 'ok';
        }
        
        return await this.inventoryRepository.save(item);
    }

    async create(data: Partial<PharmacyInventory>): Promise<PharmacyInventory> {
        const item = this.inventoryRepository.create(data);
        if (item.stockLevel < item.minThreshold) {
            item.status = 'low';
        }
        return await this.inventoryRepository.save(item);
    }
}

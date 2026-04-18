import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodInventory } from '../entities/blood-inventory.entity';
import { BloodType } from '../enums/blood-type.enum';
import { UpdateBloodInventoryDto } from '../dto/update-blood-inventory.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { JsonObject } from 'type-fest';

interface BloodTypeStatistics {
  total: number;
  available: number;
  reserved: number;
  expired: number;
  threshold: number;
  isLow: boolean;
}

export interface InventoryStatistics {
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  expiredUnits: number;
  lowInventoryTypes: string[];
  byBloodType: Record<string, BloodTypeStatistics>;
}

interface InventoryAnalytics {
  totalUnits: number;
  bloodTypeBreakdown: Record<string, BloodInventory[]>;
  lowStockAlerts: BloodInventory[];
  expiringUnits: BloodInventory[];
}

@Injectable()
export class BloodInventoryService {
  private readonly logger = new Logger(BloodInventoryService.name);

  constructor(
    @InjectRepository(BloodInventory)
    private inventoryRepository: Repository<BloodInventory>,
    private notificationsService: NotificationsService,
  ) {}

  async findByCenterAndBloodType(centerId: string, bloodType: BloodType): Promise<BloodInventory> {
    let inventory = await this.inventoryRepository.findOne({
      where: { centerId, bloodType },
      relations: ['center'],
    });

    if (!inventory) {
      // Create initial inventory record
      inventory = this.inventoryRepository.create({
        centerId,
        bloodType,
        totalUnits: 0,
        availableUnits: 0,
        reservedUnits: 0,
        expiredUnits: 0,
        minimumThreshold: 5,
      });
      inventory = await this.inventoryRepository.save(inventory);
    }

    return inventory;
  }

  async findByCenter(centerId: string): Promise<BloodInventory[]> {
    return await this.inventoryRepository.find({
      where: { centerId },
      relations: ['center'],
      order: { bloodType: 'ASC' },
    });
  }

  async updateInventory(centerId: string, bloodType: BloodType, updateData: UpdateBloodInventoryDto): Promise<BloodInventory> {
    const inventory = await this.findByCenterAndBloodType(centerId, bloodType);

    Object.assign(inventory, updateData);
    inventory.lastUpdated = new Date();

    const updatedInventory = await this.inventoryRepository.save(inventory);

    // Check if we need to send low inventory alerts
    if (updatedInventory.availableUnits <= updatedInventory.minimumThreshold) {
      await this.sendLowInventoryAlert(updatedInventory);
    }

    this.logger.log(`Blood inventory updated for center ${centerId}, type ${bloodType}`);
    return updatedInventory;
  }

  async reserveBlood(centerId: string, bloodType: BloodType, units: number): Promise<boolean> {
    const inventory = await this.findByCenterAndBloodType(centerId, bloodType);

    if (inventory.availableUnits < units) {
      return false; // Not enough units available
    }

    inventory.availableUnits -= units;
    inventory.reservedUnits += units;
    inventory.lastUpdated = new Date();

    await this.inventoryRepository.save(inventory);
    this.logger.log(`Reserved ${units} units of ${bloodType} at center ${centerId}`);
    return true;
  }

  async releaseReservedBlood(centerId: string, bloodType: BloodType, units: number): Promise<void> {
    const inventory = await this.findByCenterAndBloodType(centerId, bloodType);

    inventory.reservedUnits = Math.max(0, inventory.reservedUnits - units);
    inventory.availableUnits += units;
    inventory.lastUpdated = new Date();

    await this.inventoryRepository.save(inventory);
    this.logger.log(`Released ${units} reserved units of ${bloodType} at center ${centerId}`);
  }

  async consumeBlood(centerId: string, bloodType: BloodType, units: number): Promise<boolean> {
    const inventory = await this.findByCenterAndBloodType(centerId, bloodType);

    if (inventory.reservedUnits < units) {
      return false; // Not enough reserved units
    }

    inventory.reservedUnits -= units;
    inventory.totalUnits -= units;
    inventory.lastUpdated = new Date();

    await this.inventoryRepository.save(inventory);
    this.logger.log(`Consumed ${units} units of ${bloodType} at center ${centerId}`);
    return true;
  }

  async markExpired(centerId: string, bloodType: BloodType, units: number): Promise<void> {
    const inventory = await this.findByCenterAndBloodType(centerId, bloodType);

    inventory.availableUnits = Math.max(0, inventory.availableUnits - units);
    inventory.expiredUnits += units;
    inventory.totalUnits -= units;
    inventory.lastUpdated = new Date();

    await this.inventoryRepository.save(inventory);
    this.logger.log(`Marked ${units} units of ${bloodType} as expired at center ${centerId}`);
  }

  async getLowInventoryAlerts(): Promise<BloodInventory[]> {
    return await this.inventoryRepository
      .createQueryBuilder('inventory')
      .leftJoinAndSelect('inventory.center', 'center')
      .where('inventory.availableUnits <= inventory.minimumThreshold')
      .orderBy('inventory.availableUnits', 'ASC')
      .getMany();
  }

  async getInventoryStatistics(centerId?: string): Promise<InventoryStatistics> {
    const queryBuilder = this.inventoryRepository.createQueryBuilder('inventory');

    if (centerId) {
      queryBuilder.where('inventory.centerId = :centerId', { centerId });
    }

    const inventories = await queryBuilder.getMany();

    const statistics: InventoryStatistics = {
      totalUnits: 0,
      availableUnits: 0,
      reservedUnits: 0,
      expiredUnits: 0,
      lowInventoryTypes: [] as string[],
      byBloodType: {} as Record<string, BloodTypeStatistics>,
    };

    inventories.forEach(inventory => {
      statistics.totalUnits += inventory.totalUnits;
      statistics.availableUnits += inventory.availableUnits;
      statistics.reservedUnits += inventory.reservedUnits;
      statistics.expiredUnits += inventory.expiredUnits;

      if (inventory.availableUnits <= inventory.minimumThreshold) {
        statistics.lowInventoryTypes.push(inventory.bloodType);
      }

      statistics.byBloodType[inventory.bloodType] = {
        total: inventory.totalUnits,
        available: inventory.availableUnits,
        reserved: inventory.reservedUnits,
        expired: inventory.expiredUnits,
        threshold: inventory.minimumThreshold,
        isLow: inventory.availableUnits <= inventory.minimumThreshold,
      };
    });

    return statistics;
  }

  async getInventoryAnalytics(filters: JsonObject): Promise<InventoryAnalytics> {
    const queryBuilder = this.inventoryRepository.createQueryBuilder('inventory');

    // Apply filters
    if (filters.bloodType) {
      queryBuilder.andWhere('inventory.bloodType = :bloodType', { bloodType: filters.bloodType });
    }

    if (filters.centerId) {
      queryBuilder.andWhere('inventory.centerId = :centerId', { centerId: filters.centerId });
    }

    const inventoryData = await queryBuilder.getMany();

    return {
      totalUnits: inventoryData.reduce((sum, item) => sum + item.totalUnits, 0),
      bloodTypeBreakdown: this.groupByBloodType(inventoryData),
      lowStockAlerts: inventoryData.filter(item => item.availableUnits < 10),
      expiringUnits: inventoryData.filter(item => 
        item.lastUpdated && new Date(item.lastUpdated).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
      ),
    };
  }

  private async sendLowInventoryAlert(inventory: BloodInventory): Promise<void> {
    try {
      await this.notificationsService.createNotification({
        title: 'URGENT: Low Blood Inventory',
        message: `Blood type ${inventory.bloodType} is critically low (${inventory.availableUnits} units remaining). Minimum threshold: ${inventory.minimumThreshold} units.`,
        type: 'critical_inventory_alert',
        relatedId: inventory.centerId,
        relatedType: 'blood_inventory',
        isUrgent: true,
      });

      this.logger.warn(`Low inventory alert sent for ${inventory.bloodType} at center ${inventory.centerId}`);
    } catch (error) {
      this.logger.error(`Failed to send low inventory alert:`, error);
    }
  }

  private groupByBloodType(inventoryData: BloodInventory[]): Record<string, BloodInventory[]> {
    return inventoryData.reduce((acc, item) => {
      if (!acc[item.bloodType]) {
        acc[item.bloodType] = [];
      }
      acc[item.bloodType].push(item);
      return acc;
    }, {} as Record<string, BloodInventory[]>);
  }
}

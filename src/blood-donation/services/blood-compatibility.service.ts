import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodType } from '../enums/blood-type.enum';
import { BloodInventory } from '../entities/blood-inventory.entity';

@Injectable()
export class BloodCompatibilityService {
  private readonly logger = new Logger(BloodCompatibilityService.name);

  // Blood type compatibility matrix
  private readonly compatibilityMatrix: Record<BloodType, BloodType[]> = {
    [BloodType.O_NEGATIVE]: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE, BloodType.A_NEGATIVE, BloodType.A_POSITIVE, BloodType.B_NEGATIVE, BloodType.B_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE], // Universal donor
    [BloodType.O_POSITIVE]: [BloodType.O_POSITIVE, BloodType.A_POSITIVE, BloodType.B_POSITIVE, BloodType.AB_POSITIVE],
    [BloodType.A_NEGATIVE]: [BloodType.A_NEGATIVE, BloodType.A_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
    [BloodType.A_POSITIVE]: [BloodType.A_POSITIVE, BloodType.AB_POSITIVE],
    [BloodType.B_NEGATIVE]: [BloodType.B_NEGATIVE, BloodType.B_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
    [BloodType.B_POSITIVE]: [BloodType.B_POSITIVE, BloodType.AB_POSITIVE],
    [BloodType.AB_NEGATIVE]: [BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
    [BloodType.AB_POSITIVE]: [BloodType.AB_POSITIVE], // Universal recipient from all, but can only donate to AB+
  };

  constructor(
    @InjectRepository(BloodInventory)
    private inventoryRepository: Repository<BloodInventory>,
  ) {}

  /**
   * Check if donor blood type is compatible with recipient blood type
   */
  isCompatible(donorType: BloodType, recipientType: BloodType): boolean {
    return this.compatibilityMatrix[donorType]?.includes(recipientType) || false;
  }

  /**
   * Get all blood types that can receive from a specific donor type
   */
  getCompatibleRecipients(donorType: BloodType): BloodType[] {
    return this.compatibilityMatrix[donorType] || [];
  }

  /**
   * Get all blood types that can donate to a specific recipient type
   */
  getCompatibleDonors(recipientType: BloodType): BloodType[] {
    const compatibleDonors: BloodType[] = [];
    
    for (const [donorType, recipients] of Object.entries(this.compatibilityMatrix)) {
      if (recipients.includes(recipientType)) {
        compatibleDonors.push(donorType as BloodType);
      }
    }
    
    return compatibleDonors;
  }

  /**
   * Find available blood units for a specific blood type request
   * Returns prioritized list: exact match first, then compatible types
   */
  async findAvailableBlood(
    centerId: string,
    requestedType: BloodType,
    unitsNeeded: number,
  ): Promise<{
    exactMatch: BloodInventory | null;
    compatibleOptions: BloodInventory[];
    totalAvailable: number;
    canFulfill: boolean;
  }> {
    // Get compatible donor types
    const compatibleDonorTypes = this.getCompatibleDonors(requestedType);

    // Find all available inventory for compatible types
    const inventories = await this.inventoryRepository.find({
      where: {
        centerId,
        bloodType: compatibleDonorTypes.length > 0 ? undefined : requestedType,
      },
      relations: ['center'],
    });

    // Filter by compatibility and availability
    const compatibleInventories = inventories.filter(inv => 
      compatibleDonorTypes.includes(inv.bloodType) && inv.availableUnits > 0
    );

    // Find exact match
    const exactMatch = compatibleInventories.find(inv => inv.bloodType === requestedType) || null;

    // Sort compatible options by preference (exact match first, then by availability)
    const compatibleOptions = compatibleInventories
      .filter(inv => inv.bloodType !== requestedType) // Exclude exact match from alternatives
      .sort((a, b) => {
        // Prioritize by compatibility level and availability
        const aScore = this.getCompatibilityScore(a.bloodType, requestedType) * a.availableUnits;
        const bScore = this.getCompatibilityScore(b.bloodType, requestedType) * b.availableUnits;
        return bScore - aScore;
      });

    const totalAvailable = compatibleInventories.reduce((sum, inv) => sum + inv.availableUnits, 0);
    const canFulfill = totalAvailable >= unitsNeeded;

    return {
      exactMatch,
      compatibleOptions,
      totalAvailable,
      canFulfill,
    };
  }

  /**
   * Create an optimal allocation plan for a blood request
   */
  async createAllocationPlan(
    centerId: string,
    requestedType: BloodType,
    unitsNeeded: number,
  ): Promise<{
    allocations: Array<{
      inventory: BloodInventory;
      unitsToAllocate: number;
      isExactMatch: boolean;
    }>;
    totalAllocated: number;
    canFulfillCompletely: boolean;
  }> {
    const availableBlood = await this.findAvailableBlood(centerId, requestedType, unitsNeeded);
    
    const allocations: Array<{
      inventory: BloodInventory;
      unitsToAllocate: number;
      isExactMatch: boolean;
    }> = [];

    let remainingUnits = unitsNeeded;

    // First, allocate from exact match if available
    if (availableBlood.exactMatch && remainingUnits > 0) {
      const unitsToAllocate = Math.min(remainingUnits, availableBlood.exactMatch.availableUnits);
      allocations.push({
        inventory: availableBlood.exactMatch,
        unitsToAllocate,
        isExactMatch: true,
      });
      remainingUnits -= unitsToAllocate;
    }

    // Then allocate from compatible types if needed
    for (const inventory of availableBlood.compatibleOptions) {
      if (remainingUnits <= 0) break;

      const unitsToAllocate = Math.min(remainingUnits, inventory.availableUnits);
      allocations.push({
        inventory,
        unitsToAllocate,
        isExactMatch: false,
      });
      remainingUnits -= unitsToAllocate;
    }

    const totalAllocated = unitsNeeded - remainingUnits;
    const canFulfillCompletely = remainingUnits === 0;

    this.logger.log(`Allocation plan created for ${unitsNeeded} units of ${requestedType}: ${totalAllocated} units allocated`);

    return {
      allocations,
      totalAllocated,
      canFulfillCompletely,
    };
  }

  /**
   * Get compatibility score (higher is better match)
   */
  private getCompatibilityScore(donorType: BloodType, recipientType: BloodType): number {
    if (donorType === recipientType) return 100; // Perfect match
    
    // Same ABO group but different Rh
    if (donorType.charAt(0) === recipientType.charAt(0)) return 80;
    
    // O- is universal donor
    if (donorType === BloodType.O_NEGATIVE) return 60;
    
    // O+ can donate to positive types
    if (donorType === BloodType.O_POSITIVE && recipientType.includes('+')) return 50;
    
    // Other compatible combinations
    return 30;
  }

  /**
   * Get emergency compatibility options (less strict matching for critical situations)
   */
  getEmergencyCompatibleDonors(recipientType: BloodType): BloodType[] {
    const emergencyMatrix: Record<BloodType, BloodType[]> = {
      [BloodType.AB_POSITIVE]: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE, BloodType.A_NEGATIVE, BloodType.A_POSITIVE, BloodType.B_NEGATIVE, BloodType.B_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE], // Can receive from all
      [BloodType.AB_NEGATIVE]: [BloodType.O_NEGATIVE, BloodType.A_NEGATIVE, BloodType.B_NEGATIVE, BloodType.AB_NEGATIVE],
      [BloodType.A_POSITIVE]: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE, BloodType.A_NEGATIVE, BloodType.A_POSITIVE],
      [BloodType.A_NEGATIVE]: [BloodType.O_NEGATIVE, BloodType.A_NEGATIVE],
      [BloodType.B_POSITIVE]: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE, BloodType.B_NEGATIVE, BloodType.B_POSITIVE],
      [BloodType.B_NEGATIVE]: [BloodType.O_NEGATIVE, BloodType.B_NEGATIVE],
      [BloodType.O_POSITIVE]: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE],
      [BloodType.O_NEGATIVE]: [BloodType.O_NEGATIVE], // Most restrictive
    };

    return emergencyMatrix[recipientType] || [recipientType];
  }
}

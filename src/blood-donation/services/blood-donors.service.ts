
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BloodDonor, DonorStatus } from '../entities/blood-donor.entity';
import { CreateBloodDonorDto } from '../dto/create-blood-donor.dto';

@Injectable()
export class BloodDonorsService {
  private readonly logger = new Logger(BloodDonorsService.name);

  constructor(
    @InjectRepository(BloodDonor)
    private bloodDonorRepository: Repository<BloodDonor>,
  ) {}

  async create(userId: string, createBloodDonorDto: CreateBloodDonorDto): Promise<BloodDonor> {
    // Check if user is already a donor
    const existingDonor = await this.bloodDonorRepository.findOne({
      where: { userId },
    });

    if (existingDonor) {
      throw new BadRequestException('User is already registered as a blood donor');
    }

    // Generate unique donor number
    const donorNumber = await this.generateDonorNumber();

    // Calculate next eligible date (56 days from registration for first-time donors)
    const nextEligibleDate = new Date();
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 56);

    const bloodDonor = this.bloodDonorRepository.create({
      ...createBloodDonorDto,
      userId,
      donorNumber,
      nextEligibleDate,
      dateOfBirth: new Date(createBloodDonorDto.dateOfBirth),
    });

    const savedDonor = await this.bloodDonorRepository.save(bloodDonor);
    this.logger.log(`New blood donor registered: ${donorNumber}`);

    return savedDonor;
  }

  async findAll(page: number = 1, limit: number = 10, status?: DonorStatus, bloodType?: string) {
    const queryBuilder = this.bloodDonorRepository
      .createQueryBuilder('donor')
      .leftJoinAndSelect('donor.user', 'user')
      .orderBy('donor.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('donor.status = :status', { status });
    }

    if (bloodType) {
      queryBuilder.andWhere('donor.bloodType = :bloodType', { bloodType });
    }

    const [donors, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: donors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<BloodDonor> {
    const donor = await this.bloodDonorRepository.findOne({
      where: { id },
      relations: ['user', 'donations', 'rewards', 'verifications', 'appointments'],
    });

    if (!donor) {
      throw new NotFoundException('Blood donor not found');
    }

    return donor;
  }

  async findByUserId(userId: string): Promise<BloodDonor | null> {
    return await this.bloodDonorRepository.findOne({
      where: { userId },
      relations: ['user', 'donations', 'rewards'],
    });
  }

  async updateEligibilityStatus(id: string, status: DonorStatus, notes?: string): Promise<BloodDonor> {
    const donor = await this.findOne(id);

    donor.status = status;
    if (notes) {
      donor.notes = notes;
    }

    const updatedDonor = await this.bloodDonorRepository.save(donor);
    this.logger.log(`Donor ${donor.donorNumber} status updated to: ${status}`);

    return updatedDonor;
  }

  async getEligibleDonors(bloodType: string, limit: number = 10): Promise<BloodDonor[]> {
    const now = new Date();

    return await this.bloodDonorRepository
      .createQueryBuilder('donor')
      .leftJoinAndSelect('donor.user', 'user')
      .where('donor.bloodType = :bloodType', { bloodType })
      .andWhere('donor.status = :status', { status: DonorStatus.ELIGIBLE })
      .andWhere('(donor.nextEligibleDate IS NULL OR donor.nextEligibleDate <= :now)', { now })
      .orderBy('donor.lastDonationDate', 'ASC', 'NULLS FIRST')
      .limit(limit)
      .getMany();
  }

  async getDonorStatistics(id: string) {
    const donor = await this.findOne(id);

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    const donationsThisYear = await this.bloodDonorRepository
      .createQueryBuilder('donor')
      .leftJoin('donor.donations', 'donation')
      .where('donor.id = :id', { id })
      .andWhere('donation.donationDate >= :yearStart', { yearStart })
      .andWhere('donation.status = :status', { status: 'completed' })
      .getCount();

    return {
      totalDonations: donor.totalDonations,
      donationsThisYear,
      totalRewardPoints: donor.totalRewardPoints,
      bloodType: donor.bloodType,
      status: donor.status,
      nextEligibleDate: donor.nextEligibleDate,
      lastDonationDate: donor.lastDonationDate,
    };
  }

  private async generateDonorNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BD${year}`;
    
    const lastDonor = await this.bloodDonorRepository
      .createQueryBuilder('donor')
      .where('donor.donorNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('donor.donorNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastDonor) {
      const lastSequence = parseInt(lastDonor.donorNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { BloodDonation, DonationStatus } from '../entities/blood-donation.entity';
import { BloodDonor, DonorStatus } from '../entities/blood-donor.entity';
import { BloodDonationRequest, RequestStatus } from '../entities/blood-donation-request.entity';
import { BloodInventory } from '../entities/blood-inventory.entity';
import { CreateBloodDonationDto } from '../dto/create-blood-donation.dto';
import { PaymentGatewayService } from '../../integrations/payment-gateway.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { JsonObject } from 'type-fest';

@Injectable()
export class BloodDonationsService {
  private readonly logger = new Logger(BloodDonationsService.name);

  constructor(
    @InjectRepository(BloodDonation)
    private donationRepository: Repository<BloodDonation>,
    @InjectRepository(BloodDonor)
    private donorRepository: Repository<BloodDonor>,
    @InjectRepository(BloodDonationRequest)
    private requestRepository: Repository<BloodDonationRequest>,
    @InjectRepository(BloodInventory)
    private inventoryRepository: Repository<BloodInventory>,
    private paymentGatewayService: PaymentGatewayService,
    private notificationsService: NotificationsService,
  ) { }

  async create(createDonationDto: CreateBloodDonationDto, createdBy: string): Promise<BloodDonation> {
    // Verify donor exists and is eligible
    const donor = await this.donorRepository.findOne({
      where: { id: createDonationDto.donorId },
      relations: ['user'],
    });

    if (!donor) {
      throw new NotFoundException('Donor not found');
    }

    if (donor.status !== 'eligible') {
      throw new BadRequestException('Donor is not eligible for donation');
    }

    // Check if donor is eligible by date
    if (donor.nextEligibleDate && donor.nextEligibleDate > new Date()) {
      throw new BadRequestException(`Donor is not eligible until ${donor.nextEligibleDate.toDateString()}`);
    }

    // Generate unique donation number
    const donationNumber = await this.generateDonationNumber();

    // Calculate expiry date (35 days from donation for red blood cells)
    const expiryDate = new Date(createDonationDto.donationDate);
    expiryDate.setDate(expiryDate.getDate() + 35);

    const donation = this.donationRepository.create({
      donorId: createDonationDto.donorId,
      requestId: createDonationDto.requestId,
      bloodBankCenterId: createDonationDto.bloodBankCenterId,
      bloodType: createDonationDto.bloodType,
      volumeMl: createDonationDto.volumeMl,
      preDonationVitals: createDonationDto.preDonationVitals,
      preScreeningResults: createDonationDto.preScreeningResults,
      postDonationMonitoring: createDonationDto.postDonationMonitoring || {},
      notes: createDonationDto.notes ? { note: createDonationDto.notes } : {},
      compensationAmount: createDonationDto.compensationAmount,
      donationNumber,
      expiryDate,
      createdBy,
      donationDate: new Date(createDonationDto.donationDate),
    });

    const savedDonation = await this.donationRepository.save(donation);

    // Send notification to donor
    await this.notificationsService.createNotification({
      userId: donor.userId,
      title: 'Donation Scheduled',
      message: `Your blood donation has been scheduled for ${new Date(createDonationDto.donationDate).toLocaleDateString()}`,
      type: 'donation_scheduled',
      relatedId: savedDonation.id,
      relatedType: 'blood_donation',
    });

    this.logger.log(`New blood donation created: ${donationNumber}`);
    return savedDonation;
  }

  async findAll(page: number = 1, limit: number = 10, status?: DonationStatus, centerId?: string) {
    const queryBuilder = this.donationRepository
      .createQueryBuilder('donation')
      .leftJoinAndSelect('donation.donor', 'donor')
      .leftJoinAndSelect('donor.user', 'user')
      .leftJoinAndSelect('donation.bloodBankCenter', 'center')
      .leftJoinAndSelect('donation.request', 'request')
      .orderBy('donation.donationDate', 'DESC');

    if (status) {
      queryBuilder.andWhere('donation.status = :status', { status });
    }

    if (centerId) {
      queryBuilder.andWhere('donation.bloodBankCenterId = :centerId', { centerId });
    }

    const [donations, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: donations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<BloodDonation> {
    const donation = await this.donationRepository.findOne({
      where: { id },
      relations: ['donor', 'donor.user', 'bloodBankCenter', 'request', 'creator'],
    });

    if (!donation) {
      throw new NotFoundException('Blood donation not found');
    }

    return donation;
  }

  async completeDonation(id: string, completionData: {
    postDonationVitals?: Record<string, string | number>;
    staffNotes?: string;
    actualVolume?: number;
  }): Promise<BloodDonation> {
    const donation = await this.findOne(id);

    if (donation.status !== DonationStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled donations can be completed');
    }

    donation.status = DonationStatus.COMPLETED;
    donation.postDonationVitals = completionData.postDonationVitals;
    donation.staffNotes = completionData.staffNotes;

    if (completionData.actualVolume) {
      donation.volumeMl = completionData.actualVolume;
    }

    const updatedDonation = await this.donationRepository.save(donation);

    // Process payment if compensation is set
    if (donation.compensationAmount > 0) {
      await this.processCompensation(donation);
    }

    // Send completion notification
    await this.notificationsService.createNotification({
      userId: donation.donor?.userId || updatedDonation.donor?.userId,
      title: 'Donation Completed',
      message: 'Thank you for your blood donation! You have earned 100 reward points.',
      type: 'donation_completed',
      relatedId: donation.id,
      relatedType: 'blood_donation',
    });

    this.logger.log(`Blood donation completed: ${donation.donationNumber}`);
    return updatedDonation;
  }

  async cancelDonation(id: string, reason?: string): Promise<BloodDonation> {
    const donation = await this.findOne(id);

    if (donation.status === DonationStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed donation');
    }

    donation.status = DonationStatus.CANCELLED;
    if (reason) {
      donation.staffNotes = `Cancelled: ${reason}`;
    }

    return await this.donationRepository.save(donation);
  }

  async getDonationsByDonor(donorId: string, page: number = 1, limit: number = 10) {
    const [donations, total] = await this.donationRepository.findAndCount({
      where: { donorId },
      relations: ['bloodBankCenter', 'request'],
      order: { donationDate: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: donations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getDonationsByUserId(userId: string, page: number = 1, limit: number = 10) {
    const donor = await this.donorRepository.findOne({ where: { userId } });
    if (!donor) {
      return { data: [], total: 0, page, limit, totalPages: 0 };
    }
    return this.getDonationsByDonor(donor.id, page, limit);
  }

  private async generateDonationNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const prefix = `DN${year}${month}`;

    const lastDonation = await this.donationRepository
      .createQueryBuilder('donation')
      .where('donation.donationNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('donation.donationNumber', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastDonation) {
      const lastSequence = parseInt(lastDonation.donationNumber.substring(prefix.length));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  private async processCompensation(donation: BloodDonation): Promise<void> {
    try {
      const paymentResult = await this.paymentGatewayService.processPayment({
        amount: donation.compensationAmount,
        currency: 'usd',
        patientId: donation.donorId,
        centerId: donation.bloodBankCenterId,
        description: `Blood donation compensation for ${donation.donationNumber}`,
        paymentMethod: 'bank_transfer',
        metadata: {
          donationId: donation.id,
          donationNumber: donation.donationNumber,
        },
      });

      donation.paymentStatus = paymentResult.status === 'succeeded' ? 'completed' : 'failed';
      donation.paymentReference = paymentResult.transactionId;

      await this.donationRepository.save(donation);

      this.logger.log(`Compensation processed for donation ${donation.donationNumber}: ${paymentResult.status}`);
    } catch (error) {
      this.logger.error(`Failed to process compensation for donation ${donation.donationNumber}:`, error);
      donation.paymentStatus = 'failed';
      await this.donationRepository.save(donation);
    }
  }

  async getAnalytics(_filters: JsonObject): Promise<JsonObject> {
    const totalDonors = await this.donorRepository.count();
    const eligibleDonors = await this.donorRepository.count({ where: { status: DonorStatus.ELIGIBLE } });
    const pendingRequests = await this.requestRepository.count({ where: { status: RequestStatus.PENDING } });

    const inventory = await this.inventoryRepository.find();
    const lowStockAlerts = inventory.filter(i => i.availableUnits < i.minimumThreshold).length;

    return {
      totalDonors,
      eligibleDonors,
      pendingRequests,
      lowStockAlerts,
      donationTrends: await this.getMonthlyTrends(),
      inventoryDistribution: await this.getBloodTypeBreakdown(),
    };
  }

  async getBloodTypeBreakdown(): Promise<{ bloodType: string; availableUnits: number }[]> {
    const inventory = await this.inventoryRepository.find();
    return inventory.map(item => ({
      bloodType: item.bloodType,
      availableUnits: item.availableUnits,
    }));
  }

  async getMonthlyTrends(): Promise<{ month: string; donations: number; requests: number }[]> {
    const trends: { month: string; donations: number; requests: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });

      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const donations = await this.donationRepository.count({
        where: {
          status: DonationStatus.COMPLETED,
          donationDate: Between(startOfMonth, endOfMonth),
        }
      });

      const requests = await this.requestRepository.count({
        where: {
          createdAt: Between(startOfMonth, endOfMonth),
        }
      });

      trends.push({
        month,
        donations,
        requests,
      });
    }

    return trends;
  }
}

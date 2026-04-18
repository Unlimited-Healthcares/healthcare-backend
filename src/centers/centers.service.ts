import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HealthcareCenter } from './entities/center.entity';
import { CenterStaff } from './entities/center-staff.entity';
import { CreateCenterDto } from './dto/create-center.dto';
import { IdGeneratorService } from '../users/services/id-generator.service';
import { CreateCenterServiceDto } from './dto/create-center-service.dto';
import { CenterService } from './entities/center-service.entity';
import { CreateCenterAvailabilityDto } from './dto/create-center-availability.dto';
import { CenterAvailability } from './entities/center-availability.entity';
import { FacilityAsset } from './entities/facility-asset.entity';
import { CenterType } from '../centers/enum/center-type.enum';
import { SearchCentersDto, NearbyCentersDto } from './dto/search-centers.dto';
import { PublicCenterSearchDto, PublicCenterSearchResponseDto } from './dto/public-center-search.dto';
import { GeocodingService } from '../location/services/geocoding.service';
import { StaffWithUserDto } from './dto/staff-with-user.dto';
import { UsersService } from '../users/users.service';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateFacilityAssetDto } from './dto/create-facility-asset.dto';
import { MulterFile } from '../types/express';

@Injectable()
export class CentersService {
  /**
   * Transform center entity to PublicCenterSearchDto for search results - excludes ALL sensitive data
   */
  public transformToPublicSearchCenter(center: HealthcareCenter, ownerId?: string): PublicCenterSearchDto {
    return {
      publicId: center.displayId || center.id, // Use displayId if available, fallback to id
      id: center.id, // Include the actual UUID for API operations
      name: center.name,
      type: center.type,
      description: center.description,
      phone: center.phone,
      email: center.email,
      address: center.address,
      latitude: center.latitude,
      longitude: center.longitude,
      generalLocation: {
        city: center.city || 'Unknown',
        state: center.state || '',
        country: center.country || 'Unknown'
      },
      locationMetadata: center.locationMetadata,
      businessRegNumber: center.businessRegNumber,
      hours: center.hours,
      rating: 0, // TODO: Implement rating system
      serviceCategories: this.extractServiceCategories(center.services),
      acceptingNewPatients: true, // TODO: Implement actual availability logic
      ownerId: ownerId, // Include owner ID for job applications
      offeredServices: center.services?.map(s => ({
        id: s.id,
        name: s.serviceName, // mapped from serviceName in CenterService entity
        description: s.description,
        price: s.basePrice, // mapped from basePrice
        currency: s.currency,
        category: s.serviceCategory
      })),
      paymentSettings: center.paymentSettings
    };
  }

  /**
   * Extract general service categories from center services
   */
  private extractServiceCategories(services?: CenterService[]): string[] {
    if (!services || services.length === 0) {
      return [];
    }

    // Extract unique categories from services
    const categories = new Set<string>();
    services.forEach(service => {
      if (service.serviceCategory) {
        categories.add(service.serviceCategory);
      }
    });

    return Array.from(categories);
  }

  constructor(
    @InjectRepository(HealthcareCenter)
    private centersRepository: Repository<HealthcareCenter>,

    @InjectRepository(CenterStaff)
    private staffRepository: Repository<CenterStaff>,

    @InjectRepository(CenterService)
    private centerServicesRepository: Repository<CenterService>,

    @InjectRepository(CenterAvailability)
    private centerAvailabilityRepository: Repository<CenterAvailability>,

    @InjectRepository(FacilityAsset)
    private facilityAssetsRepository: Repository<FacilityAsset>,

    private idGeneratorService: IdGeneratorService,
    private geocodingService: GeocodingService,
    private usersService: UsersService,
    private supabaseService: SupabaseService,
  ) { }

  private async _resolveCenter(id: string): Promise<HealthcareCenter | null> {
    // 1. Try finding by Center ID
    const center = await this.centersRepository.findOne({
      where: { id, isActive: true },
    });

    if (center) return center;

    // 2. Try finding by User ID (if the user is the owner of a center)
    const staffRecords = await this.staffRepository.find({
      where: { userId: id, role: 'owner' },
      relations: ['center'],
    });

    if (staffRecords.length > 0 && staffRecords[0].center) {
      return staffRecords[0].center;
    }

    return null;
  }

  async uploadCertificate(centerId: string, file: MulterFile): Promise<HealthcareCenter> {
    const center = await this._resolveCenter(centerId);
    if (!center) {
      throw new NotFoundException(`Center not found. Please save your center profile information first before uploading documents.`);
    }
    const resolvedId = center.id;

    const fileName = `${resolvedId}/certificate_${Date.now()}_${file.originalname}`;
    const bucket = 'center-documents';

    await this.supabaseService.uploadFile(
      bucket,
      fileName,
      file.buffer,
      file.mimetype,
    );

    const publicUrl = await this.supabaseService.getFileUrl(bucket, fileName);

    center.businessRegCertificateUrl = publicUrl;
    return this.centersRepository.save(center);
  }

  async uploadLogo(centerId: string, file: MulterFile): Promise<HealthcareCenter> {
    const center = await this._resolveCenter(centerId);
    if (!center) {
      throw new NotFoundException(`Center not found. Please save your center profile information first before uploading a logo.`);
    }
    const resolvedId = center.id;

    const fileName = `${resolvedId}/logo_${Date.now()}_${file.originalname}`;
    const bucket = 'center-documents';

    await this.supabaseService.uploadFile(
      bucket,
      fileName,
      file.buffer,
      file.mimetype,
    );

    const publicUrl = await this.supabaseService.getFileUrl(bucket, fileName);

    center.logoUrl = publicUrl;
    return this.centersRepository.save(center);
  }

  async create(createCenterDto: CreateCenterDto, ownerId: string): Promise<HealthcareCenter> {
    const displayId = this.idGeneratorService.generateCenterId(createCenterDto.type);

    const center = this.centersRepository.create({
      ...createCenterDto,
      displayId,
      practiceExpiry: createCenterDto.practiceExpiry ? new Date(createCenterDto.practiceExpiry) : undefined,
    } as unknown as HealthcareCenter);

    // Set initial location geography
    if (center.latitude && center.longitude) {
      center.location = {
        type: 'Point',
        coordinates: [center.longitude, center.latitude]
      };
    }

    const savedCenter = await this.centersRepository.save(center) as unknown as HealthcareCenter;

    // Add the creator as the center owner
    const staff = this.staffRepository.create({
      userId: ownerId,
      centerId: savedCenter.id,
      role: 'owner',
    });

    await this.staffRepository.save(staff);

    return savedCenter;
  }

  async findAll(): Promise<HealthcareCenter[]> {
    return this.centersRepository.find({
      where: { isActive: true },
      relations: ['staff'],
    });
  }

  async findById(id: string): Promise<HealthcareCenter> {
    const center = await this.centersRepository.findOne({
      where: { id, isActive: true },
      relations: ['staff'],
    });

    if (!center) {
      throw new NotFoundException(`Center with ID ${id} not found`);
    }

    return center;
  }

  async findByUserId(userId: string): Promise<HealthcareCenter[]> {
    const staffRecords = await this.staffRepository.find({
      where: { userId },
      relations: ['center'],
    });

    return staffRecords.filter(staff => staff.center).map(staff => staff.center);
  }

  // Center Services
  async createService(createServiceDto: CreateCenterServiceDto): Promise<CenterService> {
    await this.findOne(createServiceDto.centerId); // Verify center exists
    const service = this.centerServicesRepository.create(createServiceDto);
    return this.centerServicesRepository.save(service);
  }

  async findAllServices(centerId: string): Promise<CenterService[]> {
    await this.findOne(centerId); // Verify center exists

    return this.centerServicesRepository.find({
      where: { centerId, isActive: true },
      order: { serviceName: 'ASC' },
    });
  }

  async findServiceById(id: string): Promise<CenterService> {
    const service = await this.centerServicesRepository.findOne({
      where: { id },
      relations: ['center'],
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async updateService(id: string, updateServiceDto: Partial<CreateCenterServiceDto>): Promise<CenterService> {
    const service = await this.findServiceById(id);

    // Remove centerId from update if present to prevent changes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { centerId: _, ...updateData } = updateServiceDto;

    Object.assign(service, updateData);
    return this.centerServicesRepository.save(service);
  }

  async deleteService(id: string): Promise<void> {
    const service = await this.findServiceById(id);
    service.isActive = false;
    await this.centerServicesRepository.save(service);
  }

  // Center Availability
  async createAvailability(createAvailabilityDto: CreateCenterAvailabilityDto): Promise<CenterAvailability> {
    await this.findOne(createAvailabilityDto.centerId); // Verify center exists

    // Check for existing availability with the same day and type
    const existing = await this.centerAvailabilityRepository.findOne({
      where: {
        centerId: createAvailabilityDto.centerId,
        dayOfWeek: createAvailabilityDto.dayOfWeek,
        isEmergencyHours: createAvailabilityDto.isEmergencyHours || false,
      },
    });

    if (existing) {
      throw new ConflictException('Availability record for this day and type already exists');
    }

    const availability = this.centerAvailabilityRepository.create(createAvailabilityDto);
    return this.centerAvailabilityRepository.save(availability);
  }

  async findAllAvailability(centerId: string): Promise<CenterAvailability[]> {
    await this.findOne(centerId); // Verify center exists

    return this.centerAvailabilityRepository.find({
      where: { centerId, isActive: true },
      order: { dayOfWeek: 'ASC' },
    });
  }

  async findAvailabilityById(id: string): Promise<CenterAvailability> {
    const availability = await this.centerAvailabilityRepository.findOne({
      where: { id },
    });

    if (!availability) {
      throw new NotFoundException('Availability record not found');
    }

    return availability;
  }

  async updateAvailability(id: string, updateAvailabilityDto: Partial<CreateCenterAvailabilityDto>): Promise<CenterAvailability> {
    const availability = await this.findAvailabilityById(id);

    // Remove centerId and dayOfWeek from update if present to prevent changes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { centerId: _, dayOfWeek: __, ...updateData } = updateAvailabilityDto;

    Object.assign(availability, updateData);
    return this.centerAvailabilityRepository.save(availability);
  }

  async deleteAvailability(id: string): Promise<void> {
    const availability = await this.findAvailabilityById(id);
    await this.centerAvailabilityRepository.remove(availability);
  }

  async update(id: string, updateCenterDto: Partial<CreateCenterDto>): Promise<HealthcareCenter> {
    const center = await this.findOne(id);

    Object.assign(center, updateCenterDto);

    // Sync location geography if coordinates changed
    if (updateCenterDto.latitude !== undefined || updateCenterDto.longitude !== undefined) {
      center.location = {
        type: 'Point',
        coordinates: [center.longitude, center.latitude]
      };
    }

    return this.centersRepository.save(center);
  }

  async remove(id: string): Promise<void> {
    const center = await this.findOne(id);
    center.isActive = false;
    await this.centersRepository.save(center);
  }

  private async findOne(id: string): Promise<HealthcareCenter> {
    const center = await this.centersRepository.findOne({
      where: { id, isActive: true },
    });

    if (!center) {
      throw new NotFoundException(`Center with ID ${id} not found`);
    }

    return center;
  }

  async getAllCenterTypes() {
    const labels: Record<string, string> = {
      hospital: 'Hospital',
      pharmacy: 'Pharmacy',
      clinic: 'Clinic',
      laboratory: 'Laboratory',
      radiology: 'Radiology',
      dental: 'Dental',
      eye: 'Eye Clinic',
      maternity: 'Maternity Center',
      ambulance: 'Ambulance / Medical Transport Team',
      virology: 'Virology Center',
      psychiatric: 'Psychiatric Center',
      'care-home': 'Care Home',
      hospice: 'Hospice',
      funeral: 'Funeral Service',
      telemedicine: 'Telemedicine'
    };

    return Object.values(CenterType).map(value => ({
      value,
      label: labels[value] || (value as string).charAt(0).toUpperCase() + (value as string).slice(1).replace(/-/g, ' ')
    }));
  }

  async findByType(type: string): Promise<PublicCenterSearchDto[]> {
    const centers = await this.centersRepository.find({
      where: { type, isActive: true },
      relations: ['staff'],
      order: { name: 'ASC' }
    });

    // Transform to public DTOs to exclude sensitive data
    return centers.map(center => {
      const owner = center.staff?.find(staff => staff.role === 'owner');
      return this.transformToPublicSearchCenter(center, owner?.userId);
    });
  }

  // Staff Management
  async addStaffMember(centerId: string, userId: string, role: string): Promise<CenterStaff> {
    // Verify center exists
    await this.findOne(centerId);

    // Check if staff member already exists
    const existingStaff = await this.staffRepository.findOne({
      where: {
        centerId,
        userId,
      },
    });

    if (existingStaff) {
      throw new ConflictException('User is already a staff member at this center');
    }

    // Validate role (can only be 'doctor', 'staff', or 'owner')
    if (!['doctor', 'staff', 'owner'].includes(role)) {
      role = 'staff'; // Default to staff if invalid role provided
    }

    const staffMember = this.staffRepository.create({
      centerId,
      userId,
      role,
    });

    return this.staffRepository.save(staffMember);
  }

  async findAllStaff(centerId: string): Promise<StaffWithUserDto[]> {
    // Verify center exists
    await this.findOne(centerId);

    const staffMembers = await this.staffRepository.find({
      where: { centerId },
      relations: ['user', 'user.profile'],
      order: { createdAt: 'DESC' },
    });

    // Transform to include safe user details
    return staffMembers.map(staff => ({
      id: staff.id,
      userId: staff.userId,
      centerId: staff.centerId,
      role: staff.role,
      user: this.usersService.transformToSafeUser(staff.user),
      createdAt: staff.createdAt,
    }));
  }

  async getCenterOwner(centerId: string): Promise<CenterStaff | null> {
    // Verify center exists
    await this.findOne(centerId);

    return this.staffRepository.findOne({
      where: { centerId, role: 'owner' },
    });
  }

  async removeStaffMember(centerId: string, staffId: string): Promise<void> {
    // Verify center exists
    await this.findOne(centerId);

    const staff = await this.staffRepository.findOne({
      where: { id: staffId, centerId },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    // Don't allow removal of center owner
    if (staff.role === 'owner') {
      throw new ConflictException('Cannot remove center owner');
    }

    await this.staffRepository.remove(staff);
  }

  async searchCenters(filters: SearchCentersDto): Promise<PublicCenterSearchResponseDto> {
    const queryBuilder = this.centersRepository
      .createQueryBuilder('center')
      .leftJoinAndSelect('center.staff', 'staff')
      .where('center.isActive = :isActive', { isActive: true });

    // Filter by center type
    if (filters.type) {
      queryBuilder.andWhere('center.type = :type', { type: filters.type });
    }

    // Generic search (name, description, ID, phone, etc.)
    if (filters.search) {
      queryBuilder.andWhere(
        '(center.name ILIKE :search OR center.description ILIKE :search OR center.business_registration_number ILIKE :search OR center.displayId ILIKE :search OR center.phone ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Filter by location
    if (filters.city) {
      queryBuilder.andWhere('center.city ILIKE :city', { city: `%${filters.city}%` });
    }
    if (filters.state) {
      queryBuilder.andWhere('center.state ILIKE :state', { state: `%${filters.state}%` });
    }
    if (filters.country) {
      queryBuilder.andWhere('center.country ILIKE :country', { country: `%${filters.country}%` });
    }

    // Legacy location filter (searches in address)
    if (filters.location && !filters.city && !filters.state && !filters.country) {
      queryBuilder.andWhere('center.address ILIKE :location', {
        location: `%${filters.location}%`
      });
    }

    // Filter by services (legacy/array-like) or single service keyword
    if (filters.service) {
      queryBuilder.andWhere(`EXISTS (
        SELECT 1 FROM center_services service 
        WHERE service.center_id = center.id
        AND service."name" ILIKE :serviceQuery
        AND service."is_available" = true
      )`, { serviceQuery: `%${filters.service}%` });
    } else if (filters.services) {
      const serviceList = filters.services.split(',').map(s => s.trim());
      // For multiple services, centers that offer ANY of them
      queryBuilder.andWhere(`EXISTS (
        SELECT 1 FROM center_services service 
        WHERE service.center_id = center.id
        AND service."name" = ANY(:services)
        AND service."is_available" = true
      )`, { services: serviceList });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const centers = await queryBuilder
      .skip((filters.page - 1) * filters.limit)
      .take(filters.limit)
      .getMany();

    const hasMore = (filters.page * filters.limit) < total;

    // Transform centers to public search DTOs to exclude ALL sensitive fields
    const publicCenters = centers.map(center => {
      const owner = center.staff?.find(staff => staff.role === 'owner');
      return this.transformToPublicSearchCenter(center, owner?.userId);
    });

    return {
      centers: publicCenters,
      total,
      page: filters.page,
      limit: filters.limit,
      hasMore
    };
  }

  async getNearbyCenters(location: NearbyCentersDto): Promise<PublicCenterSearchDto[]> {
    let _lat: number;
    let _lng: number;

    // Handle address geocoding if address is provided
    if (location.address) {
      if (location.lat || location.lng) {
        throw new BadRequestException('Cannot provide both address and coordinates. Use either address OR lat/lng.');
      }

      try {
        const geocodingResult = await this.geocodingService.geocodeAddress(location.address);
        _lat = geocodingResult.coordinates.latitude;
        _lng = geocodingResult.coordinates.longitude;
      } catch (error) {
        throw new BadRequestException(`Failed to geocode address: ${error.message}`);
      }
    } else if (location.lat !== undefined && location.lng !== undefined) {
      _lat = location.lat;
      _lng = location.lng;
    } else {
      throw new BadRequestException('Either address or both lat and lng coordinates must be provided.');
    }

    const radiusInMeters = (location.radius || 10) * 1000;

    const queryBuilder = this.centersRepository
      .createQueryBuilder('center')
      .leftJoinAndSelect('center.staff', 'staff')
      .where('center.isActive = :isActive', { isActive: true })
      // Use PostGIS geography ST_DWithin for highly accurate and indexed spatial search
      .andWhere(
        'ST_DWithin(center.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :radius)',
        { lng: _lng, lat: _lat, radius: radiusInMeters }
      )
      .orderBy(
        'ST_Distance(center.location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)',
        'ASC'
      );

    const centers = await queryBuilder.getMany();

    // Transform to public DTOs to exclude sensitive data
    return centers.map(center => {
      const owner = center.staff?.find(staff => staff.role === 'owner');
      return this.transformToPublicSearchCenter(center, owner?.userId);
    });
  }

  // Facility Assets (Services and Equipment)
  async createAsset(createAssetDto: CreateFacilityAssetDto): Promise<FacilityAsset> {
    const asset = this.facilityAssetsRepository.create(createAssetDto);
    const savedAsset = await this.facilityAssetsRepository.save(asset);
    return savedAsset;
  }

  async findAllAssets(centerId?: string, userId?: string, type?: 'service' | 'equipment'): Promise<FacilityAsset[]> {
    const query: Partial<FacilityAsset> = { isActive: true };
    if (centerId) query.centerId = centerId;
    if (userId) query.userId = userId;
    if (type) query.assetType = type;

    return this.facilityAssetsRepository.find({
      where: query,
      order: { name: 'ASC' },
    });
  }

  async findAssetById(id: string): Promise<FacilityAsset> {
    const asset = await this.facilityAssetsRepository.findOne({
      where: { id },
    });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    return asset;
  }

  async updateAsset(id: string, updateAssetDto: Partial<CreateFacilityAssetDto>): Promise<FacilityAsset> {
    const asset = await this.findAssetById(id);
    Object.assign(asset, updateAssetDto);
    return this.facilityAssetsRepository.save(asset);
  }

  async deleteAsset(id: string): Promise<void> {
    const asset = await this.findAssetById(id);
    asset.isActive = false;
    await this.facilityAssetsRepository.save(asset);
  }
}

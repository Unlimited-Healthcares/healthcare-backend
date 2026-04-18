import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { CenterStaff } from '../centers/entities/center-staff.entity';
import { HealthcareCenter } from '../centers/entities/center.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';
import { SafeUserDto } from './dto/safe-user.dto';
import { PublicUserSearchDto, PublicUserSearchResponseDto } from './dto/public-user-search.dto';
import { IdGeneratorService } from './services/id-generator.service';
import { PatientsService } from '../patients/patients.service';
import { Patient } from '../patients/entities/patient.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,

    @InjectRepository(CenterStaff)
    private centerStaffRepository: Repository<CenterStaff>,

    @InjectRepository(HealthcareCenter)
    private centersRepository: Repository<HealthcareCenter>,

    private idGeneratorService: IdGeneratorService,
    private patientsService: PatientsService,
    private notificationsService: NotificationsService,
    private supabaseService: SupabaseService,
  ) { }

  /**
   * Transform user entity to PublicUserSearchDto for search results - excludes ALL sensitive data
   */
  public transformToPublicSearchUser(user: User, patient?: Patient): PublicUserSearchDto {
    const profile = user.profile;

    return {
      id: user.id,
      publicId: user.displayId || undefined,
      displayName: profile?.displayName ||
        (profile?.firstName && profile?.lastName ?
          `${profile.firstName} ${profile.lastName}` :
          'Unknown User'),
      specialty: profile?.specialization,
      licenseExpiryDate: user.licenseExpiryDate,
      phone: profile?.phone,
      location: profile?.location ? {
        city: profile.location.city || '',
        state: profile.location.state || '',
        country: profile.location.country || ''
      } : undefined,
      rating: 0, // TODO: Implement rating system
      avatar: profile?.avatar,
      qualifications: profile?.qualifications,
      experience: profile?.experience,
      availability: profile?.availability ? {
        timezone: profile.availability.timezone || 'UTC',
        generalAvailability: this.formatGeneralAvailability(profile.availability.schedule)
      } : undefined,
      offeredServices: profile?.services?.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: s.price,
        currency: s.currency,
        category: s.category
      })),
      paymentSettings: profile?.paymentSettings ? {
        requireUpfrontPayment: profile.paymentSettings.requireUpfrontPayment,
        consultationFee: profile.paymentSettings.consultationFee,
        appointmentFee: profile.paymentSettings.appointmentFee,
        serviceFee: profile.paymentSettings.serviceFee,
        currency: profile.paymentSettings.currency
      } : undefined,
      patientId: patient?.patientId,
      publicVitals: patient?.vitals ? {
        bloodType: patient.bloodType,
        heartRate: patient.vitals.heartRate,
        bp: patient.vitals.bp,
        temp: patient.vitals.temp?.toString(),
        spO2: patient.vitals.spO2,
        height: patient.height?.toString(),
        weight: patient.weight?.toString(),
        bloodGroup: patient.bloodType
      } : undefined
    };
  }

  /**
   * Format availability schedule to general availability string
   */
  private formatGeneralAvailability(schedule?: Record<string, { start: string; end: string }>): string {
    if (!schedule || Object.keys(schedule).length === 0) {
      return 'Contact for availability';
    }

    const days = Object.keys(schedule);
    if (days.length === 7) {
      return 'Available daily';
    } else if (days.length >= 5 && days.includes('monday') && days.includes('friday')) {
      return 'Monday-Friday';
    } else {
      return 'Contact for availability';
    }
  }

  /**
   * Safely transform user entity to SafeUserDto, excluding sensitive fields
   */
  public transformToSafeUser(user: User): SafeUserDto {
    return {
      id: user.id,
      displayId: user.displayId,
      email: user.email,
      roles: user.roles,
      isActive: user.isActive,
      kycStatus: user.kycStatus,
      professionalStatus: user.professionalStatus,
      licenseExpiryDate: user.licenseExpiryDate,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile ? {
        id: user.profile.id,
        userId: user.profile.userId,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        displayName: user.profile.displayName,
        phone: user.profile.phone,
        avatar: user.profile.avatar,
        dateOfBirth: user.profile.dateOfBirth,
        gender: user.profile.gender,
        address: user.profile.address,
        bloodGroup: user.profile.bloodGroup,
        genotype: user.profile.genotype,
        height: user.profile.height,
        weight: user.profile.weight,
        specialization: user.profile.specialization,
        practiceNumber: user.profile.practiceNumber,
        governmentIdType: user.profile.governmentIdType,
        governmentIdNumber: user.profile.governmentIdNumber,
        governmentIdDoc: user.profile.governmentIdDoc,
        experience: user.profile.experience,
        qualifications: user.profile.qualifications,
        location: user.profile.location,
        availability: user.profile.availability,
        privacySettings: user.profile.privacySettings,
        professionalPractice: user.profile.professionalPractice,
        businessRegistration: user.profile.businessRegistration,
        services: user.profile.services,
        paymentSettings: user.profile.paymentSettings,
        createdAt: user.profile.createdAt,
        updatedAt: user.profile.updatedAt,
      } : undefined,
    } as SafeUserDto;
  }

  async getCenterIdForUser(userId: string): Promise<string | null> {
    try {
      // Check if user is staff/doctor of any center
      const staffRecord = await this.centerStaffRepository.findOne({
        where: { userId },
        select: ['centerId']
      });
      if (staffRecord) return staffRecord.centerId;

      // Check if user owns any center
      const ownedCenter = await this.centersRepository.findOne({
        where: { ownerId: userId },
        select: ['id']
      });
      if (ownedCenter) return ownedCenter.id;

      return null;
    } catch (error) {
      this.logger.error(`Error getting center ID for user: ${error.message}`);
      return null;
    }
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      this.logger.log(`[START] Starting user creation process for email: ${createUserDto.email}`);
      const { profile, ...userData } = createUserDto;

      // Double check if user exists even though AuthService should have checked
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        this.logger.warn(`User creation aborted: email ${userData.email} already exists`);
        throw new BadRequestException('A user with this email already exists');
      }

      // Check if phone already exists
      if (profile?.phone) {
        const existingProfile = await this.profilesRepository.findOne({
          where: { phone: profile.phone },
        });
        if (existingProfile) {
          this.logger.warn(`User creation aborted: phone ${profile.phone} already exists`);
          throw new BadRequestException('A user with this phone number already exists');
        }
      }

      // Hash the password before saving
      this.logger.debug(`[0/4] Hashing password for user: ${userData.email}`);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      this.logger.debug(`[0/4] Password hashed successfully for user: ${userData.email}`);

      // Generate display ID based on primary role
      const primaryRole = createUserDto.roles?.[0] || 'patient';
      const displayId = this.idGeneratorService.generateDisplayId(primaryRole);

      // Create user entity
      this.logger.debug(`[1/4] Creating user entity for email: ${userData.email}`);
      try {
        const user = this.usersRepository.create({
          ...userData,
          password: hashedPassword, // Use hashed password
          displayId,
          roles: createUserDto.roles || ['patient'],
        });
        this.logger.debug(`[1/4] User entity created with display ID: ${displayId}`);

        // Save user to database
        this.logger.debug(`[2/4] Attempting to save user to database: ${userData.email}`);
        await this.usersRepository.save(user);
        this.logger.debug(`[2/4] User saved successfully with ID: ${user.id}`);

        // Create profile if provided
        if (profile) {
          this.logger.debug(`[3/4] Creating profile for user ID: ${user.id}`);
          try {
            const userProfile = this.profilesRepository.create({
              ...profile,
              userId: user.id,
            });
            await this.profilesRepository.save(userProfile);
            this.logger.debug(`[3/4] Profile created successfully for user ID: ${user.id}`);
          } catch (profileError) {
            this.logger.error(`[3/4] Error saving profile: ${profileError.message}`, profileError.stack);
            throw profileError;
          }
        } else {
          this.logger.debug(`[3/4] No profile provided, skipping profile creation for user ID: ${user.id}`);
        }

        // Create patient record if user has patient role
        if (user.roles.includes('patient')) {
          this.logger.debug(`[4/5] Creating patient record for user ID: ${user.id}`);
          try {
            await this.patientsService.create({
              userId: user.id,
            });
            this.logger.debug(`[4/5] Patient record created successfully for user ID: ${user.id}`);
          } catch (patientError) {
            this.logger.error(`[4/5] Error creating patient record: ${patientError.message}`, patientError.stack);
            // Don't throw error - patient record creation is optional for existing users
            this.logger.warn(`[4/5] Continuing without patient record for user ID: ${user.id}`);
          }
        } else {
          this.logger.debug(`[4/5] User is not a patient, skipping patient record creation for user ID: ${user.id}`);
        }

        // Find and return complete user with relations
        this.logger.debug(`[5/5] Retrieving complete user with relations: ${user.id}`);
        const completeUser = await this.findById(user.id);
        this.logger.log(`[COMPLETE] User creation completed for: ${createUserDto.email}, ID: ${user.id}, Display ID: ${displayId}`);
        return completeUser;
      } catch (dbError) {
        this.logger.error(`[ERROR] Database error during user creation: ${dbError.message}`, dbError.stack);
        throw dbError;
      }
    } catch (error) {
      this.logger.error(`[ERROR] User creation failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<SafeUserDto[]> {
    const users = await this.usersRepository.find({
      relations: ['profile'],
    });
    return users.map(user => this.transformToSafeUser(user));
  }

  async findById(id: string): Promise<User> {
    try {
      this.logger.debug(`Finding user by ID: ${id}`);
      const user = await this.usersRepository.findOne({
        where: { id },
        relations: ['profile'],
      });

      if (!user) {
        this.logger.warn(`User with ID ${id} not found`);
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      this.logger.debug(`Found user: ${id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByIdSafe(id: string): Promise<SafeUserDto> {
    const user = await this.findById(id);
    return this.transformToSafeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      const user = await this.usersRepository.findOne({
        where: { email },
        relations: ['profile'],
      });

      this.logger.debug(`User lookup by email ${email} result: ${user ? 'found' : 'not found'}`);
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByResetToken(token: string): Promise<User | null> {
    try {
      this.logger.debug(`Finding user by reset token`);
      const user = await this.usersRepository.findOne({
        where: { passwordResetToken: token },
        relations: ['profile'],
      });
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by reset token: ${error.message}`, error.stack);
      throw error;
    }
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    try {
      const trimmed = (token || '').trim();
      this.logger.debug(`Finding user by verification token (length=${trimmed.length})`);

      // Use QueryBuilder with an explicit quoted column name to avoid any
      // camelCase ↔ snake_case mapping ambiguity at the ORM layer.
      const user = await this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('user.emailVerificationToken = :token', { token: trimmed })
        .getOne();

      if (user) {
        this.logger.debug(`Verification token matched user: ${user.id}`);
      } else {
        this.logger.warn(`No user found for provided verification token`);
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by verification token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Persist a verification OTP directly via QueryBuilder so there is no
   * ambiguity about which column is written regardless of naming strategy.
   */
  async saveVerificationToken(userId: string, token: string, expiry: Date): Promise<void> {
    try {
      this.logger.debug(`Saving verification token for user: ${userId}`);
      await this.usersRepository
        .createQueryBuilder()
        .update(User)
        .set({
          emailVerificationToken: token,
          emailVerificationTokenExpiry: expiry,
          lastVerificationSentAt: new Date(),
        })
        .where('id = :id', { id: userId })
        .execute();
      this.logger.debug(`Verification token saved for user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error saving verification token: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Resolve a user by either UUID (id) or public displayId
   */
  async resolveUserIdentifier(identifier: string): Promise<User> {
    // Simple UUID v4 regex (lower/upper accepted)
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    let user: User | null = null;
    const isUuid = uuidV4Regex.test(identifier);

    this.logger.debug(`Resolving user identifier: ${identifier} (isUuid: ${isUuid})`);

    if (isUuid) {
      user = await this.usersRepository.findOne({ where: { id: identifier }, relations: ['profile'] });
    } else {
      user = await this.usersRepository.findOne({ where: { displayId: identifier }, relations: ['profile'] });
    }

    if (!user || !user.isActive) {
      this.logger.warn(`User resolution failed for ${identifier}. User exists: ${!!user}, isActive: ${user?.isActive}`);
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      this.logger.debug(`Updating user with ID: ${id}`);
      const { profile, ...userData } = updateUserDto;

      // Hash password if it's being updated
      if (userData.password) {
        this.logger.debug(`Hashing new password for user ID: ${id}`);
        const saltRounds = 10;
        userData.password = await bcrypt.hash(userData.password, saltRounds);
        this.logger.debug(`Password hashed successfully for user ID: ${id}`);
      }

      // Update user data
      this.logger.debug(`Updating base user data for ID: ${id}`);
      await this.usersRepository.update(id, userData);

      // Update profile if provided
      if (profile) {
        this.logger.debug(`Updating profile for user ID: ${id}`);
        const userProfile = await this.profilesRepository.findOne({
          where: { userId: id },
        });

        if (userProfile) {
          await this.profilesRepository.update({ userId: id }, profile);
          this.logger.debug(`Existing profile updated for user ID: ${id}`);
        } else {
          const newProfile = this.profilesRepository.create({
            ...profile,
            userId: id,
          });
          await this.profilesRepository.save(newProfile);
          this.logger.debug(`New profile created for user ID: ${id}`);
        }
      }

      this.logger.debug(`User update completed for ID: ${id}`);
      return this.findById(id);
    } catch (error) {
      this.logger.error(`Error updating user: ${error.message}`, error.stack);
      throw error;
    }
  }

  async updateSafe(id: string, updateUserDto: UpdateUserDto): Promise<SafeUserDto> {
    const user = await this.update(id, updateUserDto);
    return this.transformToSafeUser(user);
  }

  async updateProfile(userId: string, profileDto: UpdateProfileDto): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { userId },
    });

    // Check phone uniqueness if provided
    if (profileDto.phone) {
      const existingProfile = await this.profilesRepository.findOne({
        where: { phone: profileDto.phone },
      });
      if (existingProfile && existingProfile.userId !== userId) {
        throw new BadRequestException('This phone number is already in use by another account');
      }
    }

    // Update licenseExpiryDate on User entity if provided
    if (profileDto.licenseExpiryDate) {
      await this.usersRepository.update(userId, {
        licenseExpiryDate: new Date(profileDto.licenseExpiryDate)
      });
    }

    // Map licenseNumber (frontend alias) to practiceNumber (entity column)
    const mappedDto: UpdateProfileDto & { practiceNumber?: string; licenseNumber?: string } = { ...profileDto };
    if (mappedDto.licenseNumber !== undefined) {
      mappedDto.practiceNumber = mappedDto.licenseNumber;
      delete mappedDto.licenseNumber;
    }

    if (!profile) {
      const { dateOfBirth, ...rest } = mappedDto;
      const newProfile = this.profilesRepository.create({
        ...(rest as unknown as Partial<Profile>),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        userId,
      });
      const saved = await this.profilesRepository.save(newProfile);
      return saved as Profile;
    }

    // Deep merge for specific JSONB fields
    const fieldsToMerge = ['preferences', 'location', 'availability', 'privacySettings', 'paymentSettings'] as const;
    fieldsToMerge.forEach(field => {
      const dtoValue = (mappedDto as Record<string, unknown>)[field];
      const profileValue = (profile as unknown as Record<string, unknown>)[field];
      if (dtoValue && profileValue) {
        (mappedDto as Record<string, unknown>)[field] = {
          ...(profileValue as Record<string, unknown>),
          ...(dtoValue as Record<string, unknown>)
        };
      }
    });

    await this.profilesRepository.update({ userId }, mappedDto as unknown as Partial<Profile>);

    // Notify user about profile update
    await this.notificationsService.createNotification({
      userId,
      type: 'profile_update',
      title: 'Profile Updated',
      message: 'Your profile has been successfully updated.',
      data: { userId }
    });

    // findOne returns Profile | null; we know it exists after update
    return this.profilesRepository.findOne({ where: { userId } }) as Promise<Profile>;
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);

    // Explicitly delete profile first to satisfy foreign key constraints
    // in case cascade delete is not yet applied at the DB layer
    if (user.profile) {
      await this.profilesRepository.remove(user.profile);
    }

    await this.usersRepository.remove(user);
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      this.logger.debug(`Finding profile for user ID: ${userId}`);
      const profile = await this.profilesRepository.findOne({
        where: { userId },
      });

      this.logger.debug(`Profile lookup for user ID ${userId} result: ${profile ? 'found' : 'not found'}`);
      return profile;
    } catch (error) {
      this.logger.error(`Error finding profile by user ID: ${error.message}`, error.stack);
      throw error;
    }
  }

  async searchUsers(filters: SearchUsersDto): Promise<PublicUserSearchResponseDto> {
    try {
      this.logger.debug(`Searching users with filters: ${JSON.stringify(filters)}`);

      const queryBuilder = this.usersRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.profile', 'profile')
        .select([
          'user.id',
          'user.displayId',
          'user.email',
          'user.roles',
          'user.isActive',
          'user.licenseExpiryDate',
          'user.createdAt',
          'user.updatedAt',
          'profile.id',
          'profile.userId',
          'profile.firstName',
          'profile.lastName',
          'profile.displayName',
          'profile.phone',
          'profile.avatar',
          'profile.dateOfBirth',
          'profile.gender',
          'profile.address',
          'profile.specialization',
          'profile.practiceNumber',
          'profile.experience',
          'profile.qualifications',
          'profile.location',
          'profile.availability',
          'profile.privacySettings',
          'profile.createdAt',
          'profile.updatedAt'
        ])
        .where('user.isActive = :isActive', { isActive: true });

      // Filter by user type (role) - Fixed: Use LIKE for simple-array field
      if (filters.type) {
        if (filters.type === 'allied_practitioner') {
          // ALLIED HEALTH CARE PRACTITIONER: Others that are not Drs or biotech guys.
          // Map to 'practitioner' or 'staff' but exclude 'doctor' and 'biotech'
          queryBuilder.andWhere('(user.roles LIKE :roleP OR user.roles LIKE :roleS)', {
            roleP: '%practitioner%',
            roleS: '%staff%'
          });
          queryBuilder.andWhere('user.roles NOT LIKE :notDoctor', { notDoctor: '%doctor%' });
          queryBuilder.andWhere('user.roles NOT LIKE :notBiotech', { notBiotech: '%biotech%' });
        } else {
          queryBuilder.andWhere('user.roles LIKE :role', { role: `%${filters.type}%` });
        }
      }

      // Filter by specialty
      if (filters.specialty) {
        queryBuilder.andWhere('profile.specialization ILIKE :specialty', { specialty: filters.specialty });
      }

      // Filter by name, specialty, ID or phone (search)
      if (filters.search) {
        queryBuilder.andWhere(
          '(profile.firstName ILIKE :search OR profile.lastName ILIKE :search OR profile.displayName ILIKE :search OR profile.specialization ILIKE :search OR user.displayId ILIKE :search OR profile.phone ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Filter by location
      if (filters.city) {
        queryBuilder.andWhere('profile.location @> :cityLocation', {
          cityLocation: JSON.stringify({ city: filters.city })
        });
      }
      if (filters.state) {
        queryBuilder.andWhere('profile.location @> :stateLocation', {
          stateLocation: JSON.stringify({ state: filters.state })
        });
      }
      if (filters.country) {
        queryBuilder.andWhere('profile.location @> :countryLocation', {
          countryLocation: JSON.stringify({ country: filters.country })
        });
      }

      // Legacy location filter (searches in city, state or country)
      if (filters.location && !filters.city && !filters.state && !filters.country) {
        queryBuilder.andWhere(
          '(profile.location->>\'city\' ILIKE :loc OR profile.location->>\'state\' ILIKE :loc OR profile.location->>\'country\' ILIKE :loc)',
          { loc: `%${filters.location}%` }
        );
      }

      // Filter by service name within the services JSONB array
      if (filters.service) {
        queryBuilder.andWhere(
          `(EXISTS (
            SELECT 1 FROM jsonb_array_elements(profile.services) AS service
            WHERE service->>'name' ILIKE :serviceQuery
          ) OR profile.specialization ILIKE :serviceQuery)`,
          { serviceQuery: `%${filters.service}%` }
        );
      }

      // Get users and total count in one go
      const [users, total] = await queryBuilder
        .skip((filters.page - 1) * filters.limit)
        .take(filters.limit)
        .getManyAndCount();

      const hasMore = (filters.page * filters.limit) < total;

      this.logger.debug(`Search completed. Found ${users.length} users out of ${total} total`);

      // Match with patient data if any
      const patientUserIds = users.filter(u => u.roles.includes('patient')).map(u => u.id);
      const patientRecords = patientUserIds.length > 0 ? await this.patientsService.findByUserIds(patientUserIds) : [];

      // Transform users to public search DTOs to exclude ALL sensitive fields
      const publicUsers = users.map(user => {
        const patient = patientRecords.find(p => p.userId === user.id);
        return this.transformToPublicSearchUser(user, patient);
      });

      return {
        users: publicUsers,
        total,
        page: filters.page,
        limit: filters.limit,
        hasMore
      };
    } catch (error) {
      this.logger.error(`Error searching users: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPublicProfile(userId: string): Promise<PublicUserProfileDto> {
    try {
      this.logger.debug(`Getting public profile for user ID: ${userId}`);

      const user = await this.usersRepository.findOne({
        where: { id: userId, isActive: true },
        relations: ['profile']
      });

      if (!user) {
        this.logger.warn(`Public profile lookup failed for ID: ${userId}. High chance of data inconsistency if this ID came from search.`);
        throw new NotFoundException('User not found');
      }

      const profile = user.profile;
      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      const publicProfile: PublicUserProfileDto = {
        id: user.id,
        name: profile.displayName || `${profile.firstName} ${profile.lastName}`,
        specialty: profile.specialization,
        licenseExpiryDate: user.licenseExpiryDate,
        location: profile.location,
        rating: 0, // TODO: Implement rating system
        availability: profile.availability,
        avatar: profile.avatar,
        qualifications: profile.qualifications,
        experience: profile.experience,
        practiceNumber: profile.practiceNumber,
        bio: profile.bio,
        professionalPractice: profile.professionalPractice,
        services: profile.services,
        paymentSettings: profile.paymentSettings,
        joinedAt: user.createdAt,
        phone: profile.phone,
      };

      this.logger.debug(`Public profile retrieved for user ID: ${userId}`);
      return publicProfile;
    } catch (error) {
      this.logger.error(`Error getting public profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  async uploadProfessionalLicense(userId: string, file: Express.Multer.File): Promise<Profile> {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found. Please create a profile first.');
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}/license_${Date.now()}.${fileExt}`;
    const bucket = 'verification-documents';

    // Upload to Supabase
    await this.supabaseService.uploadFile(
      bucket,
      fileName,
      file.buffer,
      file.mimetype
    );

    const publicUrl = await this.supabaseService.getFileUrl(bucket, fileName);

    // Update profile with document URL
    profile.professionalPractice = {
      ...profile.professionalPractice,
      practiceName: 'Professional License',
      practiceNumber: profile.practiceNumber || '',
      certifyingBody: profile.professionalPractice?.certifyingBody || 'Unknown',
      issuanceDate: profile.professionalPractice?.issuanceDate || new Date().toISOString(),
    };

    // We can also store the URL in qualifications or certificates array
    if (!profile.certificates) profile.certificates = [];
    profile.certificates.push({
      name: 'Medical License Document',
      issuer: profile.professionalPractice.certifyingBody,
      issueDate: profile.professionalPractice.issuanceDate,
      url: publicUrl
    });

    await this.profilesRepository.save(profile);

    // Automatically trigger PENDING status
    await this.submitProfessionalVerification(userId);

    return profile;
  }

  async submitProfessionalVerification(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.professionalStatus = 'PENDING';
    const saved = await this.usersRepository.save(user);

    await this.notificationsService.createNotification({
      userId,
      type: 'system',
      title: 'Professional Verification Submitted',
      message: 'Your professional credentials have been submitted for review. This typically takes 24-48 hours.',
      data: { userId, status: 'PENDING' }
    });

    return saved;
  }

  async approveProfessionalVerification(userId: string, expiryDate?: Date): Promise<User> {
    const user = await this.findById(userId);
    user.professionalStatus = 'APPROVED';
    if (expiryDate) {
      user.licenseExpiryDate = expiryDate;
    }
    const saved = await this.usersRepository.save(user);

    await this.notificationsService.createNotification({
      userId,
      type: 'system',
      title: 'Professional Verification Approved',
      message: 'Your professional credentials have been verified. You now have full access to professional features.',
      data: { userId, status: 'APPROVED' }
    });

    return saved;
  }

  async rejectProfessionalVerification(userId: string, reason?: string): Promise<User> {
    const user = await this.findById(userId);
    user.professionalStatus = 'REJECTED';
    const saved = await this.usersRepository.save(user);

    await this.notificationsService.createNotification({
      userId,
      type: 'system',
      title: 'Professional Verification Rejected',
      message: `Your professional verification was rejected. ${reason || 'Please ensure your license details are correct and try again.'}`,
      data: { userId, status: 'REJECTED', reason }
    });

    return saved;
  }

  async submitKyc(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.kycStatus = 'PENDING';
    return this.usersRepository.save(user);
  }

  async approveKyc(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.kycStatus = 'APPROVED';
    const saved = await this.usersRepository.save(user);

    await this.notificationsService.createNotification({
      userId,
      type: 'system',
      title: 'KYC Verification Approved',
      message: 'Your identity documents have been verified. You now have full access to platform features.',
      data: { userId, status: 'APPROVED' }
    });

    return saved;
  }

  async rejectKyc(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.kycStatus = 'REJECTED';
    const saved = await this.usersRepository.save(user);

    await this.notificationsService.createNotification({
      userId,
      type: 'system',
      title: 'KYC Verification Rejected',
      message: 'Your identity documents could not be verified. Please check your submission and try again.',
      data: { userId, status: 'REJECTED' }
    });

    return saved;
  }

  async incrementLoginAttempts(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      this.logger.warn(`User ${user.email} locked out until ${user.lockoutUntil}`);
    }
    return this.usersRepository.save(user);
  }

  async resetLoginAttempts(userId: string): Promise<void> {
    await this.usersRepository.update(userId, {
      loginAttempts: 0,
      lockoutUntil: null,
    });
  }

  /**
   * Get connections for a user (approved requests)
   */
  async getConnections(userId: string, page: number = 1, limit: number = 20): Promise<PublicUserSearchDto[]> {
    try {
      this.logger.debug(`Fetching connections for user: ${userId}`);

      // Use raw query or query builder to find unique users from approved requests
      // A connection is where current user is either sender or recipient
      const query = await this.usersRepository.manager
        .createQueryBuilder()
        .select('DISTINCT CASE WHEN sender_id = :userId THEN recipient_id ELSE sender_id END', 'id')
        .from('user_requests', 'req')
        .where('status = :status', { status: 'approved' })
        .andWhere('(sender_id = :userId OR recipient_id = :userId)', { userId })
        .setParameters({ userId })
        .offset((page - 1) * limit)
        .limit(limit)
        .getRawMany();

      const connectionIds = query.map(q => q.id);

      if (connectionIds.length === 0) {
        return [];
      }

      const users = await this.usersRepository.find({
        where: connectionIds.map(id => ({ id })),
        relations: ['profile'],
      });

      // Match with patient data if any
      const patientUserIds = users.filter(u => u.roles.includes('patient')).map(u => u.id);
      const patientRecords = patientUserIds.length > 0 ? await this.patientsService.findByUserIds(patientUserIds) : [];

      return users.map(user => {
        const patient = patientRecords.find(p => p.userId === user.id);
        return this.transformToPublicSearchUser(user, patient);
      });
    } catch (error) {
      this.logger.error(`Error fetching connections: ${error.message}`, error.stack);
      throw error;
    }
  }
}

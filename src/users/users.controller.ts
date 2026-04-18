import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { KycService } from './kyc.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { PublicUserProfileDto } from './dto/public-user-profile.dto';
import { SafeUserDto } from './dto/safe-user.dto';
import { PublicUserSearchDto, PublicUserSearchResponseDto } from './dto/public-user-search.dto';
import { ResolveUserResponseDto } from './dto/resolve-user.dto';
import { SubmitKycDto } from './dto/kyc.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly kycService: KycService,
  ) { }

  @Get('connections')
  @ApiOperation({ summary: 'Get current user connections (approved requests)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Connections found successfully.', type: [PublicUserSearchDto] })
  async getConnections(
    @GetCurrentUserId() userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    console.log('DEBUG: UsersController.getConnections hit');
    return this.usersService.getConnections(userId, page, limit);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create user (admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get('resolve/:publicId')
  @Public()
  @ApiOperation({ summary: 'Resolve publicId to UUID' })
  @ApiResponse({ status: 200, description: 'Mapping found', type: ResolveUserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async resolvePublicId(@Param('publicId') publicId: string): Promise<ResolveUserResponseDto> {
    const user = await this.usersService.resolveUserIdentifier(publicId);
    return {
      publicId: user.displayId || '',
      uuid: user.id,
      displayName: user.profile?.displayName || (
        user.profile?.firstName && user.profile?.lastName
          ? `${user.profile.firstName} ${user.profile.lastName}`
          : 'Unknown User'
      ),
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (admin only)' })
  @ApiResponse({ status: 200, description: 'Return all users.', type: [SafeUserDto] })
  findAll(): Promise<SafeUserDto[]> {
    return this.usersService.findAll();
  }

  @Post('profile')
  @ApiOperation({ summary: 'Create or update current user profile' })
  @ApiResponse({ status: 201, description: 'Profile created successfully.' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async createOrUpdateProfile(
    @GetCurrentUserId() userId: string,
    @Body() profileDto: CreateProfileDto
  ): Promise<Profile> {
    return this.usersService.updateProfile(userId, profileDto);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async getMyProfile(@GetCurrentUserId() userId: string): Promise<Profile | null> {
    const profile = await this.usersService.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException(`Profile not found for user ID: ${userId}`);
    }
    return profile;
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search users by criteria (public endpoint - no sensitive data)' })
  @ApiResponse({ status: 200, description: 'Users found successfully.', type: PublicUserSearchResponseDto })
  async searchUsers(@Query() filters: SearchUsersDto) {
    return this.usersService.searchUsers(filters);
  }

  // ALL DYNAMIC ROUTES BELOW HERE

  @Get(':id/public-profile')
  @Public()
  @ApiOperation({ summary: 'Get public user profile (accepts UUID or publicId)' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getPublicProfile(@Param('id') id: string): Promise<PublicUserProfileDto> {
    const user = await this.usersService.resolveUserIdentifier(id);
    return this.usersService.getPublicProfile(user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'doctor', 'staff')
  @ApiOperation({ summary: 'Get user by id' })
  @ApiResponse({ status: 200, description: 'Return the found user.', type: SafeUserDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findOne(@Param('id') id: string): Promise<SafeUserDto> {
    console.log(`DEBUG: UsersController.findOne hit with id: ${id}`);
    try {
      const user = await this.usersService.resolveUserIdentifier(id);
      return this.usersService.transformToSafeUser(user);
    } catch (error) {
      console.log(`DEBUG: UsersController.findOne FAILED to find user: ${id}`);
      throw new NotFoundException(`User with ID ${id} not found [DEBUG]`);
    }
  }


  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update user (admin only)' })
  @ApiResponse({ status: 200, description: 'User successfully updated.', type: SafeUserDto })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<SafeUserDto> {
    return this.usersService.updateSafe(id, updateUserDto);
  }

  @Patch(':id/profile')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update user profile (admin only)' })
  @ApiResponse({ status: 200, description: 'Profile successfully updated.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  updateProfile(@Param('id') id: string, @Body() profileDto: UpdateProfileDto): Promise<Profile> {
    return this.usersService.updateProfile(id, profileDto);
  }

  @Post('me/kyc')
  @ApiOperation({ summary: 'Submit KYC verification with documents' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'KYC submitted successfully.' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'idDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]))
  async submitKyc(
    @GetCurrentUserId() userId: string,
    @Body() dto: SubmitKycDto,
    @UploadedFiles() files: { idDocument?: Express.Multer.File[]; selfie?: Express.Multer.File[] },
  ) {
    const idDocFile = files?.idDocument?.[0];
    if (!idDocFile) {
      throw new NotFoundException('ID document file is required');
    }

    const selfieFile = files?.selfie?.[0];
    const submission = await this.kycService.submitKyc(userId, dto, idDocFile, selfieFile);

    // Return updated user so frontend can update state
    const user = await this.usersService.findById(userId);
    return {
      submission: {
        id: submission.id,
        status: submission.status,
        submittedAt: submission.submittedAt,
      },
      user: this.usersService.transformToSafeUser(user),
    };
  }

  @Get('me/kyc')
  @ApiOperation({ summary: 'Get current user KYC submissions' })
  @ApiResponse({ status: 200, description: 'KYC submissions retrieved.' })
  async getMyKycSubmissions(@GetCurrentUserId() userId: string) {
    const submissions = await this.kycService.getSubmissionsByUserId(userId);
    return { submissions };
  }

  @Post('me/professional-license')
  @ApiOperation({ summary: 'Upload professional license document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'License uploaded successfully.' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'license', maxCount: 1 },
  ]))
  async uploadProfessionalLicense(
    @GetCurrentUserId() userId: string,
    @UploadedFiles() files: { license?: Express.Multer.File[] },
  ) {
    const licenseFile = files?.license?.[0];
    if (!licenseFile) {
      throw new NotFoundException('License file is required');
    }

    return this.usersService.uploadProfessionalLicense(userId, licenseFile);
  }

  @Post('me/professional-verify')
  @ApiOperation({ summary: 'Submit professional credentials for verification' })
  @ApiResponse({ status: 201, description: 'Credentials submitted successfully.' })
  async submitProfessionalVerification(@GetCurrentUserId() userId: string) {
    return this.usersService.submitProfessionalVerification(userId);
  }

  @Post(':id/approve-professional')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Approve professional verification (admin only)' })
  @ApiResponse({ status: 200, description: 'Professional verified successfully.' })
  async approveProfessional(@Param('id') id: string) {
    return this.usersService.approveProfessionalVerification(id);
  }

  @Post(':id/reject-professional')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Reject professional verification (admin only)' })
  @ApiResponse({ status: 200, description: 'Professional verification rejected.' })
  async rejectProfessional(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.usersService.rejectProfessionalVerification(id, reason);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user (admin only)' })
  @ApiResponse({ status: 200, description: 'User successfully deleted.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.usersService.remove(id);
  }
}

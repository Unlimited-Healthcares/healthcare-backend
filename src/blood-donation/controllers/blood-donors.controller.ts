
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../../auth/decorators/get-current-user-id.decorator';
import { BloodDonorsService } from '../services/blood-donors.service';
import { CreateBloodDonorDto } from '../dto/create-blood-donor.dto';
import { DonorStatus } from '../entities/blood-donor.entity';

@ApiTags('Blood Donors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blood-donation/donors')
export class BloodDonorsController {
  constructor(private readonly bloodDonorsService: BloodDonorsService) { }

  @Post()
  @Roles('admin', 'staff', 'center')
  @ApiOperation({ summary: 'Create a new blood donor' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Donor created successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid donor data' })
  async create(
    @Body() createBloodDonorDto: CreateBloodDonorDto,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.bloodDonorsService.create(userId, createBloodDonorDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register as a blood donor' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Donor registration successful' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'User already registered as donor' })
  async register(
    @Body() createBloodDonorDto: CreateBloodDonorDto,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.bloodDonorsService.create(userId, createBloodDonorDto);
  }

  @Get()
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get all blood donors' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donors retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('status') status?: DonorStatus,
    @Query('bloodType') bloodType?: string,
  ) {
    return await this.bloodDonorsService.findAll(page, limit, status, bloodType);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user donor profile' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donor profile retrieved' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'User is not a registered donor' })
  async getMyProfile(@GetCurrentUserId() userId: string) {
    const donor = await this.bloodDonorsService.findByUserId(userId);
    if (!donor) {
      return { message: 'User is not a registered blood donor' };
    }
    return donor;
  }

  @Get('eligible/:bloodType')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get eligible donors for specific blood type' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Eligible donors retrieved' })
  async getEligibleDonors(
    @Param('bloodType') bloodType: string,
    @Query('limit') limit: number = 10,
  ) {
    return await this.bloodDonorsService.getEligibleDonors(bloodType, limit);
  }

  @Get(':id')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get donor by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donor retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Donor not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.bloodDonorsService.findOne(id);
  }

  @Get(':id/statistics')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get donor statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getDonorStatistics(@Param('id', ParseUUIDPipe) id: string) {
    return await this.bloodDonorsService.getDonorStatistics(id);
  }

  @Patch(':id/status')
  @Roles('admin', 'healthcare_provider')
  @ApiOperation({ summary: 'Update donor eligibility status' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Status updated successfully' })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: { status: DonorStatus; notes?: string },
  ) {
    return await this.bloodDonorsService.updateEligibilityStatus(
      id,
      updateData.status,
      updateData.notes,
    );
  }
}

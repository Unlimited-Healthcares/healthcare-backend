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
import { BloodDonationsService } from '../services/blood-donations.service';
import { CreateBloodDonationDto } from '../dto/create-blood-donation.dto';
import { DonationStatus } from '../entities/blood-donation.entity';


@ApiTags('Blood Donations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blood-donation/donations')
export class BloodDonationsController {
  constructor(private readonly donationsService: BloodDonationsService) { }

  @Post()
  @Roles('admin', 'staff', 'center')
  @ApiOperation({ summary: 'Schedule blood donation' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Donation scheduled successfully' })
  async create(
    @Body() createDonationDto: CreateBloodDonationDto,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.donationsService.create(createDonationDto, userId);
  }

  @Get()
  @Roles('admin', 'staff', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get all blood donations' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donations retrieved successfully' })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
    @Query('status') status?: DonationStatus,
    @Query('centerId') centerId?: string,
  ) {
    return await this.donationsService.findAll(page, limit, status, centerId);
  }

  @Get('my-donations')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get current user donations (if donor)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User donations retrieved' })
  async getMyDonations(
    @GetCurrentUserId() userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return await this.donationsService.getDonationsByUserId(userId, page, limit);
  }

  @Get('donor/:donorId')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get donations by donor ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donor donations retrieved' })
  async getDonationsByDonor(
    @Param('donorId', ParseUUIDPipe) donorId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.donationsService.getDonationsByDonor(donorId, page, limit);
  }

  @Get(':id')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get donation by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donation retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Donation not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.donationsService.findOne(id);
  }

  @Patch(':id/complete')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Complete blood donation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donation completed successfully' })
  async completeDonation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completionData: {
      postDonationVitals?: Record<string, string | number>;
      staffNotes?: string;
      actualVolume?: number;
    },
  ) {
    return await this.donationsService.completeDonation(id, completionData);
  }

  @Patch(':id/cancel')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Cancel blood donation' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Donation cancelled successfully' })
  async cancelDonation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelData: { reason?: string },
  ) {
    return await this.donationsService.cancelDonation(id, cancelData.reason);
  }

  // Analytics moved to separate controller
}

import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { BloodInventoryService } from '../services/blood-inventory.service';
import { BloodCompatibilityService } from '../services/blood-compatibility.service';
import { UpdateBloodInventoryDto } from '../dto/update-blood-inventory.dto';
import { BloodType } from '../enums/blood-type.enum';

@ApiTags('Blood Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('blood-donation/inventory')
export class BloodInventoryController {
  constructor(
    private readonly inventoryService: BloodInventoryService,
    private readonly compatibilityService: BloodCompatibilityService,
  ) { }

  @Get()
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get blood inventory overview' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inventory retrieved successfully' })
  async findAll(@Query('bloodType') bloodType?: string, @Query('centerId') centerId?: string) {
    if (centerId && bloodType) {
      return await this.inventoryService.findByCenterAndBloodType(centerId, bloodType as BloodType);
    } else if (centerId) {
      return await this.inventoryService.findByCenter(centerId);
    } else {
      return await this.inventoryService.getInventoryStatistics();
    }
  }

  @Get('center/:centerId')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get blood inventory for center' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inventory retrieved successfully' })
  async getCenterInventory(@Param('centerId', ParseUUIDPipe) centerId: string) {
    return await this.inventoryService.findByCenter(centerId);
  }

  @Get('center/:centerId/blood-type/:bloodType')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get inventory for specific blood type at center' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Blood type inventory retrieved' })
  async getBloodTypeInventory(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Param('bloodType') bloodType: BloodType,
  ) {
    return await this.inventoryService.findByCenterAndBloodType(centerId, bloodType);
  }

  @Get('low-alerts')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get low inventory alerts' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Low inventory alerts retrieved' })
  async getLowInventoryAlerts() {
    return await this.inventoryService.getLowInventoryAlerts();
  }

  @Get('statistics')
  @Roles('admin', 'staff', 'patient', 'doctor', 'nurse', 'healthcare_provider', 'center')
  @ApiOperation({ summary: 'Get inventory statistics' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Statistics retrieved successfully' })
  async getStatistics(@Query('centerId') centerId?: string) {
    return await this.inventoryService.getInventoryStatistics(centerId);
  }

  @Get('compatibility/:bloodType')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get blood type compatibility information' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Compatibility information retrieved' })
  async getCompatibilityInfo(@Param('bloodType') bloodType: BloodType) {
    return {
      requestedType: bloodType,
      canDonateTo: this.compatibilityService.getCompatibleRecipients(bloodType),
      canReceiveFrom: this.compatibilityService.getCompatibleDonors(bloodType),
      emergencyCompatible: this.compatibilityService.getEmergencyCompatibleDonors(bloodType),
    };
  }

  @Get('availability/:centerId/:bloodType/:units')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Check blood availability for request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Availability information retrieved' })
  async checkAvailability(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Param('bloodType') bloodType: BloodType,
    @Param('units') units: number,
  ) {
    return await this.compatibilityService.findAvailableBlood(centerId, bloodType, units);
  }

  @Get('allocation-plan/:centerId/:bloodType/:units')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Get optimal allocation plan for blood request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Allocation plan created' })
  async getAllocationPlan(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Param('bloodType') bloodType: BloodType,
    @Param('units') units: number,
  ) {
    return await this.compatibilityService.createAllocationPlan(centerId, bloodType, units);
  }

  @Patch('center/:centerId/blood-type/:bloodType')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Update blood inventory' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Inventory updated successfully' })
  async updateInventory(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Param('bloodType') bloodType: BloodType,
    @Body() updateData: UpdateBloodInventoryDto,
  ) {
    return await this.inventoryService.updateInventory(centerId, bloodType, updateData);
  }

  @Patch('reserve/:centerId/:bloodType/:units')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Reserve blood units' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Blood reserved successfully' })
  async reserveBlood(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Param('bloodType') bloodType: BloodType,
    @Param('units') units: number,
  ) {
    const success = await this.inventoryService.reserveBlood(centerId, bloodType, units);
    return { success, message: success ? 'Blood reserved successfully' : 'Insufficient units available' };
  }

  @Patch('consume/:centerId/:bloodType/:units')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Consume reserved blood units' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Blood consumed successfully' })
  async consumeBlood(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Param('bloodType') bloodType: BloodType,
    @Param('units') units: number,
  ) {
    const success = await this.inventoryService.consumeBlood(centerId, bloodType, units);
    return { success, message: success ? 'Blood consumed successfully' : 'Insufficient reserved units' };
  }

  @Patch('expire/:centerId/:bloodType/:units')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Mark blood units as expired' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Units marked as expired' })
  async markExpired(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Param('bloodType') bloodType: BloodType,
    @Param('units') units: number,
  ) {
    await this.inventoryService.markExpired(centerId, bloodType, units);
    return { message: 'Units marked as expired successfully' };
  }
}

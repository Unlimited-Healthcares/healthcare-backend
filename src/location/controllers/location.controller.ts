import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { LocationService } from '../services/location.service';
import { GeocodingService } from '../services/geocoding.service';
import { GeofencingService } from '../services/geofencing.service';
import {
  GeocodeAddressDto,
  ReverseGeocodeDto,
} from '../dto/location-update.dto';
import { CreateGeofenceZoneDto } from '../dto/create-geofence-zone.dto';
import { UpdateGeofenceZoneDto } from '../dto/update-geofence-zone.dto';
import { AuthenticatedRequest } from '../../types/request.types';

@ApiTags('location')
@Controller('location')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly geocodingService: GeocodingService,
    private readonly geofencingService: GeofencingService,
  ) {}

  @Post('validate-coordinates')
  @ApiOperation({ summary: 'Validate GPS coordinates' })
  @ApiResponse({ status: 200, description: 'Coordinates validated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  @Roles('admin', 'doctor', 'nurse', 'patient')
  async validateCoordinates(
    @Body() body: { latitude: number; longitude: number }
  ) {
    const { latitude, longitude } = body;
    this.locationService.validateCoordinates(latitude, longitude);
    return {
      valid: true,
      coordinates: { latitude, longitude },
      normalized: this.locationService.normalizeCoordinates({ latitude, longitude }),
    };
  }

  @Post('calculate-distance')
  @ApiOperation({ summary: 'Calculate distance between two points' })
  @ApiResponse({ status: 200, description: 'Distance calculated successfully' })
  @Roles('admin', 'doctor', 'nurse', 'patient')
  async calculateDistance(
    @Body() body: {
      point1: { latitude: number; longitude: number };
      point2: { latitude: number; longitude: number };
    }
  ) {
    const distance = this.locationService.calculateDistance(body.point1, body.point2);
    return {
      distance,
      unit: 'kilometers',
      point1: body.point1,
      point2: body.point2,
    };
  }

  @Post('geocode')
  @ApiOperation({ summary: 'Convert address to coordinates' })
  @ApiResponse({ status: 200, description: 'Address geocoded successfully' })
  @Roles('admin', 'doctor', 'nurse')
  async geocodeAddress(@Body() dto: GeocodeAddressDto) {
    const result = await this.geocodingService.geocodeAddress(dto.address);
    return result;
  }

  @Post('reverse-geocode')
  @ApiOperation({ summary: 'Convert coordinates to address' })
  @ApiResponse({ status: 200, description: 'Coordinates reverse geocoded successfully' })
  @Roles('admin', 'doctor', 'nurse')
  async reverseGeocode(@Body() dto: ReverseGeocodeDto) {
    const result = await this.geocodingService.reverseGeocode(dto.latitude, dto.longitude);
    return result;
  }

  @Post('geofences')
  @ApiOperation({ summary: 'Create a new geofence zone' })
  @ApiResponse({ status: 201, description: 'Geofence zone created successfully' })
  @Roles('admin', 'doctor')
  async createGeofenceZone(
    @Body() dto: CreateGeofenceZoneDto,
    @Request() req: AuthenticatedRequest
  ) {
    const geofence = await this.geofencingService.createGeofenceZone(dto, req.user.id);
    return geofence;
  }

  @Get('geofences')
  @ApiOperation({ summary: 'Get geofence zones for a center' })
  @ApiQuery({ name: 'centerId', required: false, description: 'Healthcare center ID' })
  @ApiResponse({ status: 200, description: 'Geofence zones retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse')
  async getGeofenceZones(@Query('centerId') centerId?: string) {
    if (centerId) {
      const geofences = await this.geofencingService.getGeofenceZonesByCenter(centerId);
      return {
        success: true,
        data: geofences,
        message: 'Geofence zones retrieved successfully',
      };
    } else {
      const geofences = await this.geofencingService.getAllGeofenceZones();
      return {
        success: true,
        data: geofences,
        message: 'All geofence zones retrieved successfully',
      };
    }
  }

  @Get('geofences/:id')
  @ApiOperation({ summary: 'Get a specific geofence zone' })
  @ApiResponse({ status: 200, description: 'Geofence zone retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Geofence zone not found' })
  @ApiParam({ name: 'id', description: 'Geofence zone ID' })
  @Roles('admin', 'doctor', 'nurse')
  async getGeofenceZone(@Param('id') id: string) {
    const geofence = await this.geofencingService.getGeofenceZone(id);
    return geofence;
  }

  @Put('geofences/:id')
  @ApiOperation({ summary: 'Update a geofence zone' })
  @ApiResponse({ status: 200, description: 'Geofence zone updated successfully' })
  @ApiResponse({ status: 404, description: 'Geofence zone not found' })
  @ApiParam({ name: 'id', description: 'Geofence zone ID' })
  @Roles('admin', 'doctor')
  async updateGeofenceZone(
    @Param('id') id: string,
    @Body() dto: UpdateGeofenceZoneDto,
    @Request() req: AuthenticatedRequest
  ) {
    const geofence = await this.geofencingService.updateGeofenceZone(id, dto, req.user.id);
    return geofence;
  }

  @Delete('geofences/:id')
  @ApiOperation({ summary: 'Delete a geofence zone' })
  @ApiResponse({ status: 200, description: 'Geofence zone deleted successfully' })
  @ApiResponse({ status: 404, description: 'Geofence zone not found' })
  @ApiParam({ name: 'id', description: 'Geofence zone ID' })
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteGeofenceZone(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    await this.geofencingService.deleteGeofenceZone(id, req.user.id);
    return { message: 'Geofence zone deleted successfully' };
  }

  @Get('history/:entityType/:entityId')
  @ApiOperation({ summary: 'Get location history for an entity' })
  @ApiResponse({ status: 200, description: 'Location history retrieved successfully' })
  @Roles('admin', 'doctor', 'nurse', 'patient')
  async getLocationHistory(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Query('limit') limit?: number
  ) {
    const history = await this.locationService.getLocationHistory(entityType, entityId, limit);
    return {
      success: true,
      data: history,
      message: 'Location history retrieved successfully',
    };
  }
}
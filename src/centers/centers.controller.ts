import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { CentersService } from './centers.service';
import { CreateCenterDto } from './dto/create-center.dto';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseUUIDPipe } from '@nestjs/common';
import { CreateCenterServiceDto } from './dto/create-center-service.dto';
import { CreateCenterAvailabilityDto } from './dto/create-center-availability.dto';
import { SearchCentersDto, NearbyCentersDto } from './dto/search-centers.dto';
import { PublicCenterSearchDto, PublicCenterSearchResponseDto } from './dto/public-center-search.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CenterType } from './enum/center-type.enum';
import { Public } from '../auth/decorators/public.decorator';
import { StaffWithUserDto } from './dto/staff-with-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../types/express';

@ApiTags('centers')
@ApiBearerAuth('access-token')
@Controller('centers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CentersController {
  @Post(':id/upload-certificate')
  @Roles('admin', 'center')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload healthcare center registration certificate' })
  @ApiResponse({ status: 200, description: 'Certificate uploaded successfully.' })
  async uploadCertificate(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
  ) {
    const center = await this.centersService.uploadCertificate(id, file);
    return { url: center.businessRegCertificateUrl };
  }

  @Post(':id/upload-registration')
  @Roles('admin', 'center')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload healthcare center registration document (alias for certificate)' })
  @ApiResponse({ status: 200, description: 'Registration document uploaded successfully.' })
  async uploadRegistration(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
  ) {
    const center = await this.centersService.uploadCertificate(id, file);
    return { url: center.businessRegCertificateUrl };
  }

  @Post(':id/upload-logo')
  @Roles('admin', 'center')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload healthcare center logo' })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully.' })
  async uploadLogo(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
  ) {
    const center = await this.centersService.uploadLogo(id, file);
    return { url: center.logoUrl };
  }

  constructor(private readonly centersService: CentersService) { }

  @Post()
  @Roles('admin', 'center')
  @ApiOperation({ summary: 'Register a new healthcare center' })
  @ApiResponse({ status: 201, description: 'Center successfully registered.' })
  async create(
    @Body() createCenterDto: CreateCenterDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.centersService.create(createCenterDto, userId);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all centers (admin only)' })
  @ApiResponse({ status: 200, description: 'Return all centers.' })
  findAll() {
    return this.centersService.findAll();
  }

  @Get('types')
  @Public()
  @ApiOperation({ summary: 'Get all center types' })
  @ApiResponse({
    status: 200,
    description: 'Return all available center types.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'string', example: 'hospital' },
          label: { type: 'string', example: 'Hospital' }
        }
      }
    }
  })
  getAllCenterTypes() {
    return this.centersService.getAllCenterTypes();
  }

  @Get('types/:type')
  @Public()
  @ApiOperation({ summary: 'Get centers by type (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return centers of specified type.',
    type: [PublicCenterSearchDto]
  })
  getCentersByType(@Param('type') type: string) {
    return this.centersService.findByType(type);
  }

  @Get('eye-clinics')
  @Public()
  @ApiOperation({ summary: 'Get all eye clinics (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all eye clinics.',
    type: [PublicCenterSearchDto]
  })
  getEyeClinics() {
    return this.centersService.findByType(CenterType.EYE);
  }

  @Get('maternity')
  @Public()
  @ApiOperation({ summary: 'Get all maternity centers (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all maternity centers.',
    type: [PublicCenterSearchDto]
  })
  getMaternityCenter() {
    return this.centersService.findByType(CenterType.MATERNITY);
  }

  @Get('virology')
  @Public()
  @ApiOperation({ summary: 'Get all virology centers (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all virology centers.',
    type: [PublicCenterSearchDto]
  })
  getVirologyCenter() {
    return this.centersService.findByType(CenterType.VIROLOGY);
  }

  @Get('psychiatric')
  @Public()
  @ApiOperation({ summary: 'Get all psychiatric centers (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all psychiatric centers.',
    type: [PublicCenterSearchDto]
  })
  getPsychiatricCenter() {
    return this.centersService.findByType(CenterType.PSYCHIATRIC);
  }

  @Get('care-homes')
  @Public()
  @ApiOperation({ summary: 'Get all care homes (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all care homes.',
    type: [PublicCenterSearchDto]
  })
  getCareHomes() {
    return this.centersService.findByType(CenterType.CARE_HOME);
  }

  @Get('hospice')
  @Public()
  @ApiOperation({ summary: 'Get all hospice centers (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all hospice centers.',
    type: [PublicCenterSearchDto]
  })
  getHospice() {
    return this.centersService.findByType(CenterType.HOSPICE);
  }

  @Get('funeral')
  @Public()
  @ApiOperation({ summary: 'Get all funeral services (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all funeral services.',
    type: [PublicCenterSearchDto]
  })
  getFuneral() {
    return this.centersService.findByType(CenterType.FUNERAL);
  }

  @Get('hospital')
  @Public()
  @ApiOperation({ summary: 'Get all hospital centers (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all hospital centers.',
    type: [PublicCenterSearchDto]
  })
  getHospitals() {
    return this.centersService.findByType(CenterType.HOSPITAL);
  }

  @Get('ambulance')
  @Public()
  @ApiOperation({ summary: 'Get all ambulance services (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all ambulance services.',
    type: [PublicCenterSearchDto]
  })
  getAmbulanceServices() {
    return this.centersService.findByType(CenterType.AMBULANCE);
  }

  @Get('radiology')
  @Public()
  @ApiOperation({ summary: 'Get all radiology centers (public endpoint - no sensitive data)' })
  @ApiResponse({
    status: 200,
    description: 'Return all radiology centers.',
    type: [PublicCenterSearchDto]
  })
  getRadiologyCenters() {
    return this.centersService.findByType(CenterType.RADIOLOGY);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search centers by criteria (public endpoint - no sensitive data)' })
  @ApiResponse({ status: 200, description: 'Centers found successfully.', type: PublicCenterSearchResponseDto })
  async searchCenters(@Query() filters: SearchCentersDto) {
    return this.centersService.searchCenters(filters);
  }

  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Find nearby centers (public endpoint - no sensitive data)' })
  @ApiResponse({ status: 200, description: 'Nearby centers found successfully.', type: [PublicCenterSearchDto] })
  async getNearbyCenters(@Query() location: NearbyCentersDto) {
    return this.centersService.getNearbyCenters(location);
  }

  @Get(':id')
  @Roles('admin', 'center', 'doctor', 'staff', 'patient')
  @ApiOperation({ summary: 'Get center by ID' })
  @ApiResponse({ status: 200, description: 'Return the center.' })
  @ApiResponse({ status: 404, description: 'Center not found.' })
  findOne(@Param('id') id: string) {
    return this.centersService.findById(id);
  }

  @Get('user/:userId')
  @Roles('admin', 'center')
  @ApiOperation({ summary: 'Get centers by user ID' })
  @ApiResponse({ status: 200, description: 'Return user centers.' })
  findByUser(@Param('userId') userId: string) {
    return this.centersService.findByUserId(userId);
  }

  // Center Services
  @Post(':id/services')
  @Roles('admin', 'center')
  createService(
    @Param('id', ParseUUIDPipe) centerId: string,
    @Body() createServiceDto: CreateCenterServiceDto,
  ) {
    return this.centersService.createService({
      ...createServiceDto,
      centerId,
    });
  }

  @Get(':id/services')
  @Roles('admin', 'center', 'doctor', 'staff', 'patient')
  findAllServices(@Param('id', ParseUUIDPipe) centerId: string) {
    return this.centersService.findAllServices(centerId);
  }

  @Get('services/:id')
  @Roles('admin', 'center', 'doctor', 'staff', 'patient')
  findServiceById(@Param('id', ParseUUIDPipe) id: string) {
    return this.centersService.findServiceById(id);
  }

  @Patch('services/:id')
  @Roles('admin', 'center')
  updateService(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: Partial<CreateCenterServiceDto>,
  ) {
    return this.centersService.updateService(id, updateServiceDto);
  }

  @Delete('services/:id')
  @Roles('admin', 'center')
  deleteService(@Param('id', ParseUUIDPipe) id: string) {
    return this.centersService.deleteService(id);
  }

  // Center Availability
  @Post(':id/availability')
  @Roles('admin', 'center')
  createAvailability(
    @Param('id', ParseUUIDPipe) centerId: string,
    @Body() createAvailabilityDto: CreateCenterAvailabilityDto,
  ) {
    return this.centersService.createAvailability({
      ...createAvailabilityDto,
      centerId,
    });
  }

  @Get(':id/availability')
  @Roles('admin', 'center', 'doctor', 'staff', 'patient')
  findAllAvailability(@Param('id', ParseUUIDPipe) centerId: string) {
    return this.centersService.findAllAvailability(centerId);
  }

  @Get('availability/:id')
  @Roles('admin', 'center', 'doctor', 'staff', 'patient')
  findAvailabilityById(@Param('id', ParseUUIDPipe) id: string) {
    return this.centersService.findAvailabilityById(id);
  }

  @Patch('availability/:id')
  @Roles('admin', 'center')
  updateAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAvailabilityDto: Partial<CreateCenterAvailabilityDto>,
  ) {
    return this.centersService.updateAvailability(id, updateAvailabilityDto);
  }

  @Delete('availability/:id')
  @Roles('admin', 'center')
  deleteAvailability(@Param('id', ParseUUIDPipe) id: string) {
    return this.centersService.deleteAvailability(id);
  }

  @Patch(':id')
  @Roles('admin', 'center')
  @ApiOperation({ summary: 'Update center by ID' })
  @ApiResponse({ status: 200, description: 'Center successfully updated.' })
  @ApiResponse({ status: 404, description: 'Center not found.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCenterDto: Partial<CreateCenterDto>,
  ) {
    return this.centersService.update(id, updateCenterDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete center by ID' })
  @ApiResponse({ status: 200, description: 'Center successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Center not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.centersService.remove(id);
  }

  // Center Staff Management
  @Post(':id/staff')
  @Roles('admin', 'center')
  @ApiOperation({ summary: 'Add a staff or doctor to a center' })
  @ApiResponse({ status: 201, description: 'Staff member successfully added to center.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Center or user not found.' })
  @ApiResponse({ status: 409, description: 'User is already a staff member at this center.' })
  addStaffMember(
    @Param('id', ParseUUIDPipe) centerId: string,
    @Body() addStaffDto: { userId: string, role: string },
  ) {
    return this.centersService.addStaffMember(centerId, addStaffDto.userId, addStaffDto.role);
  }

  @Get(':id/staff')
  @Roles('admin', 'center', 'doctor', 'staff', 'patient')
  @ApiOperation({ summary: 'Get all staff members for a center' })
  @ApiResponse({ status: 200, description: 'Return center staff members with user details.', type: [StaffWithUserDto] })
  findAllStaff(@Param('id', ParseUUIDPipe) centerId: string) {
    return this.centersService.findAllStaff(centerId);
  }

  @Get(':id/owner')
  @Public()
  @ApiOperation({ summary: 'Get center owner information (for job applications)' })
  @ApiResponse({ status: 200, description: 'Return center owner information.' })
  @ApiResponse({ status: 404, description: 'Center not found.' })
  getCenterOwner(@Param('id', ParseUUIDPipe) centerId: string) {
    return this.centersService.getCenterOwner(centerId);
  }

  @Delete(':id/staff/:staffId')
  @Roles('admin', 'center')
  @ApiOperation({ summary: 'Remove a staff member from a center' })
  @ApiResponse({ status: 200, description: 'Staff member successfully removed.' })
  @ApiResponse({ status: 404, description: 'Staff member or center not found.' })
  removeStaffMember(
    @Param('id', ParseUUIDPipe) centerId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ) {
    return this.centersService.removeStaffMember(centerId, staffId);
  }
}

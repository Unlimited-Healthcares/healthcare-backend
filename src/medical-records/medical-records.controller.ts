import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MedicalRecordsService } from './medical-records.service';
import { MedicalRecordFilesService } from './medical-record-files.service';
import { MedicalRecordVersionsService } from './medical-record-versions.service';
import { MedicalRecordCategoriesService } from './medical-record-categories.service';
import { CreateMedicalRecordDto } from './dto/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dto/update-medical-record.dto';
import { FileUploadDto } from './dto/file-upload.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MulterFile } from '../types/express';

import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('medical-records')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('healthcare_provider', 'admin', 'doctor', 'nurse', 'center', 'patient', 'biotech_engineer')
export class MedicalRecordsController {
  constructor(
    private readonly medicalRecordsService: MedicalRecordsService,
    private readonly filesService: MedicalRecordFilesService,
    private readonly versionsService: MedicalRecordVersionsService,
    private readonly categoriesService: MedicalRecordCategoriesService,
  ) { }

  @Post()
  @Roles('healthcare_provider', 'admin', 'doctor', 'nurse', 'center', 'biotech_engineer')
  @ApiOperation({ summary: 'Create a new medical record' })
  @ApiResponse({ status: 201, description: 'Medical record created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  async create(@Body() createMedicalRecordDto: CreateMedicalRecordDto, @Req() req) {
    // If not a staff member, default to null or provide a system/center ID if applicable
    createMedicalRecordDto.centerId = req.user.centerId || createMedicalRecordDto.centerId;
    createMedicalRecordDto.createdBy = req.user.staffId || req.user.id;
    return await this.medicalRecordsService.create(createMedicalRecordDto);
  }

  @Get()
  async findAll(@Req() req, @Query('patientId') patientId?: string) {
    return await this.medicalRecordsService.findAll(req.user.centerId, patientId, {
      userId: req.user.id,
      roles: req.user.roles
    });
  }

  // Enhanced Search and Filtering - MUST come before :id routes
  @Get('search')
  async searchRecords(
    @Req() req,
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('recordType') recordType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('patientId') patientId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    console.log('Search endpoint called with query:', query);
    const filters = {
      query,
      category,
      tags: tags ? tags.split(',') : undefined,
      recordType,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      patientId,
      centerId: req.user.centerId,
    };

    return await this.medicalRecordsService.searchRecords(filters, page, limit, {
      userId: req.user.id,
      roles: req.user.roles
    });
  }

  @Get('tags')
  async getAllTags(@Req() req) {
    console.log('Tags endpoint called');
    return await this.medicalRecordsService.getAllTags(req.user.centerId);
  }

  // Categories Management - MUST come before :id routes
  @Get('categories')
  async getCategories() {
    console.log('Categories endpoint called');
    return await this.categoriesService.getAllCategories();
  }

  @Get('categories/hierarchy')
  async getCategoryHierarchy(@Req() req) {
    return await this.categoriesService.getCategoryHierarchy(req.user.centerId);
  }

  @Post('categories')
  async createCategory(@Body() createCategoryDto) {
    // Map parentId to parentCategoryId if present
    if (createCategoryDto.parentId !== undefined) {
      createCategoryDto.parentCategoryId = createCategoryDto.parentId;
      delete createCategoryDto.parentId;
    }
    return await this.categoriesService.createCategory(createCategoryDto);
  }

  @Patch('categories/:id')
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto) {
    // Map parentId to parentCategoryId if present
    if (updateCategoryDto.parentId !== undefined) {
      updateCategoryDto.parentCategoryId = updateCategoryDto.parentId;
      delete updateCategoryDto.parentId;
    }
    return await this.categoriesService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    await this.categoriesService.deleteCategory(id);
    return { message: 'Category deleted successfully' };
  }

  @Get('dashboard/stats')
  async getDashboardStats(
    @GetCurrentUserId() userId: string,
    @Query('centerId') centerId?: string,
    @Query('period') period?: string,
  ) {
    const targetCenterId = centerId || userId;
    return await this.medicalRecordsService.getMedicalReportAnalytics(targetCenterId, period);
  }

  @Get('analytics')
  async getAnalytics(
    @GetCurrentUserId() userId: string,
    @Query('centerId') centerId?: string,
    @Query('period') period?: string,
  ) {
    const targetCenterId = centerId || userId;
    return await this.medicalRecordsService.getMedicalReportAnalytics(targetCenterId, period);
  }

  @Get('quick-stats')
  async getQuickStats(
    @GetCurrentUserId() userId: string,
    @Query('centerId') centerId?: string,
  ) {
    const targetCenterId = centerId || userId;
    return await this.medicalRecordsService.getQuickStats(targetCenterId);
  }

  @Get('chart-data')
  async getChartData(
    @GetCurrentUserId() userId: string,
    @Query('centerId') centerId?: string,
    @Query('period') period?: string,
  ) {
    const targetCenterId = centerId || userId;
    return await this.medicalRecordsService.getChartData(targetCenterId, period);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    console.log('FindOne endpoint called with id:', id);
    return await this.medicalRecordsService.findOne(id, {
      userId: req.user.id,
      roles: req.user.roles
    });
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMedicalRecordDto: UpdateMedicalRecordDto) {
    return await this.medicalRecordsService.update(id, updateMedicalRecordDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.medicalRecordsService.remove(id);
    return { message: 'Medical record deleted successfully' };
  }

  // File Management Endpoints
  @Post(':id/files')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') recordId: string,
    @UploadedFile() file: MulterFile,
    @Body() uploadDto: FileUploadDto,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const createFileDto = {
      recordId,
      fileName: '',
      originalFileName: file.originalname,
      filePath: '',
      fileType: '',
      fileSize: file.size,
      mimeType: file.mimetype,
      metadata: uploadDto.metadata,
      createdBy: req.user.staffId,
    };

    return await this.filesService.uploadFile(file, createFileDto);
  }

  @Get(':id/files')
  async getRecordFiles(@Param('id') recordId: string) {
    return await this.filesService.getFilesByRecordId(recordId);
  }

  @Get('files/:fileId')
  async getFile(@Param('fileId') fileId: string) {
    return await this.filesService.getFileById(fileId);
  }

  @Get('files/:fileId/url')
  async getFileUrl(@Param('fileId') fileId: string) {
    const url = await this.filesService.getFileUrl(fileId);
    return { url };
  }

  @Delete('files/:fileId')
  async deleteFile(@Param('fileId') fileId: string) {
    await this.filesService.deleteFile(fileId);
    return { message: 'File deleted successfully' };
  }

  @Post(':id/files/:fileId/convert-dicom')
  @Roles('healthcare_provider', 'admin')
  @ApiOperation({ summary: 'Convert DICOM file to JPEG' })
  @ApiParam({ name: 'id', description: 'Medical record ID' })
  @ApiParam({ name: 'fileId', description: 'DICOM file ID' })
  @ApiResponse({ status: 200, description: 'DICOM file converted successfully' })
  async convertDicomToJpeg(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
  ): Promise<{ message: string; url?: string }> {
    const result = await this.filesService.convertDicomToJpeg(fileId);
    return {
      message: 'DICOM file conversion initiated',
      url: result
    };
  }

  // Versioning Endpoints
  @Get(':id/versions')
  async getVersionHistory(@Param('id') recordId: string) {
    return await this.versionsService.getVersionHistory(recordId);
  }

  @Get('versions/:versionId')
  async getVersion(@Param('versionId') versionId: string) {
    return await this.versionsService.getVersionById(versionId);
  }

  @Post(':id/revert/:versionNumber')
  async revertToVersion(
    @Param('id') recordId: string,
    @Param('versionNumber') versionNumber: number,
    @Req() req,
  ) {
    return await this.versionsService.revertToVersion(recordId, versionNumber, req.user.staffId);
  }

  @Get('versions/:versionId1/compare/:versionId2')
  async compareVersions(
    @Param('versionId1') versionId1: string,
    @Param('versionId2') versionId2: string,
  ) {
    return await this.versionsService.compareVersions(versionId1, versionId2);
  }

  @Get('audit-logs')
  @Roles('center', 'admin')
  async getAccessLogs(
    @Req() req,
    @Query('recordId') recordId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return await this.medicalRecordsService.getAccessLogs(req.user.centerId, recordId, page, limit);
  }
}

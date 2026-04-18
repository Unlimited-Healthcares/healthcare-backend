import {
  Controller,
  Get,
  Post,
  Body,
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
import { ImagingService } from './imaging.service';
import { CreateImagingStudyDto } from './dto/create-imaging-study.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { MulterFile } from '../types/express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('imaging')
@Controller('imaging')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImagingController {
  constructor(private readonly imagingService: ImagingService) {}

  @Post('studies')
  @Roles('doctor', 'staff', 'admin', 'center')
  @ApiOperation({ summary: 'Create a new imaging study' })
  async createStudy(
    @Body() createDto: CreateImagingStudyDto,
    @Req() req,
  ) {
    const providerId = req.user.staffId || req.user.id;
    const centerId = req.user.centerId;
    return await this.imagingService.createStudy(createDto, providerId, centerId);
  }

  @Post('studies/:id/upload')
  @Roles('doctor', 'staff', 'admin', 'center')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a DICOM file to a study' })
  async uploadFile(
    @Param('id') studyId: string,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return await this.imagingService.uploadImagingFile(studyId, file);
  }

  @Get('studies/patient/:patientId')
  @Roles('doctor', 'staff', 'admin', 'center', 'patient')
  @ApiOperation({ summary: 'Get all imaging studies for a patient' })
  async getPatientStudies(
    @Param('patientId') patientId: string,
    @Req() req,
  ) {
    // Security: Patient can only see their own studies
    if (req.user.roles.includes('patient') && req.user.id !== patientId) {
      throw new BadRequestException('Unauthorized to view these studies');
    }
    return await this.imagingService.getPatientStudies(patientId);
  }

  @Get('studies/:id')
  @Roles('doctor', 'staff', 'admin', 'center', 'patient')
  @ApiOperation({ summary: 'Get imaging study details' })
  async getStudy(
    @Param('id') id: string,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.imagingService.getStudy(id, userId);
  }

  @Get('files/:fileId/url')
  @Roles('doctor', 'staff', 'admin', 'center', 'patient')
  @ApiOperation({ summary: 'Get a signed URL to view/download a DICOM file' })
  async getFileUrl(
    @Param('fileId') fileId: string,
    @GetCurrentUserId() userId: string,
  ) {
    const url = await this.imagingService.getFileUrl(fileId, userId);
    return { url };
  }
}

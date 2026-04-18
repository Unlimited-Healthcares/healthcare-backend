import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { CreatePatientVisitDto } from './dto/create-patient-visit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '../types/express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('patients')
@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post()
  @Roles('admin', 'staff', 'doctor', 'center')
  create(
    @Body() createPatientDto: CreatePatientDto,
    @GetCurrentUserId() creatorId: string,
  ) {
    return this.patientsService.create(createPatientDto, creatorId);
  }

  @Get()
  @Roles('admin', 'staff', 'doctor', 'center')
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('centerId') centerId?: string,
  ) {
    return this.patientsService.findAll(page, limit, search, centerId);
  }

  @Get('search')
  @Roles('admin', 'staff', 'doctor', 'center')
  search(@Query('query') query: string) {
    return this.patientsService.search(query);
  }

  @Get('me')
  @Roles('patient')
  findMyRecord(@GetCurrentUserId() userId: string) {
    return this.patientsService.findByUserId(userId);
  }

  @Get(':id')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePatientDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, updatePatientDto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.remove(id);
  }

  // Patient Visits
  @Post(':id/visits')
  @Roles('admin', 'staff', 'doctor', 'center')
  createVisit(
    @Param('id', ParseUUIDPipe) patientId: string,
    @Body() createVisitDto: CreatePatientVisitDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.patientsService.createVisit(createVisitDto, patientId, userId);
  }

  @Get(':id/visits')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  getPatientVisits(@Param('id', ParseUUIDPipe) patientId: string) {
    return this.patientsService.findPatientVisits(patientId);
  }

  @Get('visits/:id')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  getVisitById(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.findVisitById(id);
  }

  @Patch('visits/:id')
  @Roles('admin', 'staff', 'doctor', 'center')
  updateVisit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVisitDto: Partial<CreatePatientVisitDto>,
  ) {
    return this.patientsService.updateVisit(id, updateVisitDto);
  }

  @Delete('visits/:id')
  @Roles('admin', 'staff', 'doctor', 'center')
  removeVisit(@Param('id', ParseUUIDPipe) id: string) {
    return this.patientsService.removeVisit(id);
  }

  // Patient Documents
  @Post(':id/documents')
  @Roles('admin', 'staff', 'doctor', 'center')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id', ParseUUIDPipe) patientId: string,
    @UploadedFile() file: MulterFile,
    @Body() uploadDto: { description?: string },
  ) {
    return this.patientsService.uploadDocument(patientId, file, uploadDto);
  }

  @Get(':id/documents')
  @Roles('admin', 'staff', 'doctor', 'center', 'patient')
  async getDocuments(@Param('id', ParseUUIDPipe) patientId: string) {
    return this.patientsService.getDocuments(patientId);
  }

  // Patient Approved Providers
  @Get(':id/approved-doctors')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  @ApiOperation({ summary: 'Get approved doctors for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of approved doctors for the patient',
    schema: {
      type: 'object',
      properties: {
        doctors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              providerId: { type: 'string', format: 'uuid' },
              providerType: { type: 'string', enum: ['doctor'] },
              status: { type: 'string', enum: ['approved'] },
              approvedAt: { type: 'string', format: 'date-time' },
              provider: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string' },
                  profile: {
                    type: 'object',
                    properties: {
                      firstName: { type: 'string' },
                      lastName: { type: 'string' },
                      specialization: { type: 'string' },
                      phone: { type: 'string' },
                      avatar: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  async getApprovedDoctors(@Param('id', ParseUUIDPipe) patientId: string) {
    return this.patientsService.getApprovedDoctors(patientId);
  }

  @Get(':id/approved-centers')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  @ApiOperation({ summary: 'Get approved healthcare centers for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of approved healthcare centers for the patient',
    schema: {
      type: 'object',
      properties: {
        centers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              providerId: { type: 'string', format: 'uuid' },
              providerType: { type: 'string', enum: ['center'] },
              status: { type: 'string', enum: ['approved'] },
              approvedAt: { type: 'string', format: 'date-time' },
              center: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  address: { type: 'string' },
                  phone: { type: 'string' },
                  email: { type: 'string' },
                  centerType: { type: 'string' }
                }
              }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  async getApprovedCenters(@Param('id', ParseUUIDPipe) patientId: string) {
    return this.patientsService.getApprovedCenters(patientId);
  }

  @Get(':id/approved-providers')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  @ApiOperation({ summary: 'Get all approved providers (doctors and centers) for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all approved providers for the patient',
    schema: {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              providerId: { type: 'string', format: 'uuid' },
              providerType: { type: 'string', enum: ['doctor', 'center'] },
              status: { type: 'string', enum: ['approved'] },
              approvedAt: { type: 'string', format: 'date-time' },
              provider: { type: 'object' },
              center: { type: 'object' }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  async getApprovedProviders(@Param('id', ParseUUIDPipe) patientId: string) {
    return this.patientsService.getApprovedProviders(patientId);
  }

  @Get(':id/approved-providers/count')
  @Roles('admin', 'staff', 'patient', 'doctor', 'center')
  @ApiOperation({ summary: 'Get count of approved providers for a patient' })
  @ApiParam({ name: 'id', description: 'Patient ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Count of approved providers for the patient',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number' },
        doctors: { type: 'number' },
        centers: { type: 'number' }
      }
    }
  })
  async getApprovedProvidersCount(@Param('id', ParseUUIDPipe) patientId: string) {
    return this.patientsService.getApprovedProvidersCount(patientId);
  }
}

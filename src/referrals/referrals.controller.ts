import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReferralsService } from './referrals.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralDto } from './dto/update-referral.dto';
import { CreateReferralDocumentDto } from './dto/create-referral-document.dto';
import { Referral, ReferralStatus } from './entities/referral.entity';
import { ReferralDocument } from './entities/referral-document.entity';
import { MulterFile } from '../types/express';
import { AuthenticatedRequest } from '../types/request.types';

interface ReferralAnalytics {
  totalReferrals: number;
  referralsByStatus: Array<{ status: string; count: string }>;
  referralsByType: Array<{ type: string; count: string }>;
  inboundVsOutbound: {
    inbound: number;
    outbound: number;
  };
  timeRange: {
    startDate?: Date;
    endDate?: Date;
  };
}

@ApiTags('Referrals')
@Controller('referrals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
@ApiBearerAuth()
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) { }

  // Create a new referral
  @Post()
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Create a new referral' })
  @ApiResponse({
    status: 201,
    description: 'The referral has been successfully created.',
    type: Referral
  })
  async create(
    @Body() createReferralDto: CreateReferralDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Referral> {
    return await this.referralsService.create(createReferralDto, req.user.userId);
  }

  // Get all referrals with optional filters
  @Get()
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Get all referrals with optional filters' })
  @ApiQuery({ name: 'patientId', required: false })
  @ApiQuery({ name: 'referringCenterId', required: false })
  @ApiQuery({ name: 'receivingCenterId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ReferralStatus })
  @ApiResponse({
    status: 200,
    description: 'List of referrals',
    type: [Referral],
  })
  async findAll(
    @Query('patientId') patientId?: string,
    @Query('referringCenterId') referringCenterId?: string,
    @Query('receivingCenterId') receivingCenterId?: string,
    @Query('status') status?: ReferralStatus,
  ): Promise<Referral[]> {
    return await this.referralsService.findAll({
      patientId,
      referringCenterId,
      receivingCenterId,
      status,
    });
  }

  // Get a specific referral by ID
  @Get(':id')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Get a specific referral by ID' })
  @ApiParam({ name: 'id', description: 'Referral ID' })
  @ApiResponse({
    status: 200,
    description: 'The referral details',
    type: Referral,
  })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Referral> {
    return await this.referralsService.findOne(id);
  }

  // Update a referral
  @Patch(':id')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Update a referral' })
  @ApiParam({ name: 'id', description: 'Referral ID' })
  @ApiResponse({
    status: 200,
    description: 'The referral has been successfully updated',
    type: Referral,
  })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReferralDto: UpdateReferralDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Referral> {
    return await this.referralsService.update(id, updateReferralDto, req.user.userId);
  }

  // Delete a referral
  @Delete(':id')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Delete a referral' })
  @ApiParam({ name: 'id', description: 'Referral ID' })
  @ApiResponse({ status: 204, description: 'The referral has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return await this.referralsService.remove(id, req.user.userId);
  }

  // Document management
  @Get(':id/documents')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Get all documents for a referral' })
  @ApiParam({ name: 'id', description: 'Referral ID' })
  @ApiResponse({
    status: 200,
    description: 'List of referral documents',
    type: [ReferralDocument],
  })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async getDocuments(@Param('id', ParseUUIDPipe) id: string): Promise<ReferralDocument[]> {
    return await this.referralsService.getDocuments(id);
  }

  @Post(':id/documents')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document to a referral' })
  @ApiParam({ name: 'id', description: 'Referral ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        name: {
          type: 'string',
          example: 'Lab Results',
        },
        documentType: {
          type: 'string',
          example: 'lab_result',
        },
        description: {
          type: 'string',
          example: 'Complete blood count results',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The document has been successfully uploaded',
    type: ReferralDocument,
  })
  @ApiResponse({ status: 404, description: 'Referral not found' })
  async uploadDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: MulterFile,
    @Body() createDocumentDto: CreateReferralDocumentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReferralDocument> {
    // Override the referralId from the path parameter
    createDocumentDto.referralId = id;

    return await this.referralsService.uploadDocument(
      file,
      createDocumentDto,
      req.user.userId,
    );
  }

  @Get('documents/:id')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Get a specific document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'The document details',
    type: ReferralDocument,
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocument(@Param('id', ParseUUIDPipe) id: string): Promise<ReferralDocument> {
    return await this.referralsService.getDocument(id);
  }

  @Get('documents/:id/download')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Get download URL for a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'The document download URL',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          example: 'https://example.com/document.pdf',
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async getDocumentUrl(@Param('id', ParseUUIDPipe) id: string): Promise<{ url: string }> {
    const url = await this.referralsService.getDocumentUrl(id);
    return { url };
  }

  @Delete('documents/:id')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 204, description: 'The document has been successfully deleted' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async deleteDocument(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return await this.referralsService.deleteDocument(id, req.user.userId);
  }

  // Analytics
  @Get('analytics/:centerId')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  @ApiOperation({ summary: 'Get referral analytics for a center' })
  @ApiParam({ name: 'centerId', description: 'Healthcare Center ID' })
  @ApiQuery({ name: 'startDate', required: false, type: Date })
  @ApiQuery({ name: 'endDate', required: false, type: Date })
  @ApiResponse({
    status: 200,
    description: 'Referral analytics data',
    schema: {
      type: 'object',
      properties: {
        totalReferrals: { type: 'number' },
        referralsByStatus: { type: 'array' },
        referralsByType: { type: 'array' },
        inboundVsOutbound: {
          type: 'object',
          properties: {
            inbound: { type: 'number' },
            outbound: { type: 'number' },
          },
        },
        timeRange: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  async getAnalytics(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Query('startDate') startDate?: Date,
    @Query('endDate') endDate?: Date,
  ): Promise<ReferralAnalytics> {
    return await this.referralsService.getReferralAnalytics(
      centerId,
      startDate,
      endDate,
    );
  }

  @Get('dashboard-summary/:centerId')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  async getDashboardSummary(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Query() params: Record<string, unknown>,
  ) {
    return await this.referralsService.getReferralDashboardSummary(centerId, params);
  }

  @Get('center/:centerId')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  async getReferralsForCenter(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Query() params: Record<string, unknown>,
  ) {
    return await this.referralsService.getReferralsForCenter(centerId, params);
  }

  @Get('facility/center/:centerId')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  async getFacilityReferralsForCenter(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Query() params: Record<string, unknown>,
  ) {
    // Reusing getReferralsForCenter for now
    return await this.referralsService.getReferralsForCenter(centerId, params);
  }

  @Get('facility/resources/:centerId')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  async getFacilityResources(
    @Param('centerId', ParseUUIDPipe) _centerId: string,
  ) {
    return [];
  }

  @Get(':id/status-history')
  @Roles('healthcare_provider', 'admin', 'doctor', 'center', 'staff', 'nurse')
  async getStatusHistory(@Param('id', ParseUUIDPipe) id: string) {
    return await this.referralsService.getReferralStatusHistory(id);
  }
} 
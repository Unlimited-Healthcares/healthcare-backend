
import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CentersService } from './centers.service';
import { CreateFacilityAssetDto } from './dto/create-facility-asset.dto';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('assets')
@ApiBearerAuth('access-token')
@Controller('assets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssetsController {
    constructor(private readonly centersService: CentersService) { }

    @Post()
    @Roles('admin', 'center', 'doctor', 'staff')
    @ApiOperation({ summary: 'Add a new service or equipment' })
    async create(
        @Body() createAssetDto: CreateFacilityAssetDto,
        @GetCurrentUserId() userId: string,
    ) {
        // If no owner is specified, default to the current user
        if (!createAssetDto.centerId && !createAssetDto.userId) {
            createAssetDto.userId = userId;
        }
        return this.centersService.createAsset(createAssetDto);
    }

    @Get()
    @Public()
    @ApiOperation({ summary: 'Get assets with filters' })
    async findAll(
        @Query('centerId') centerId?: string,
        @Query('userId') userId?: string,
        @Query('type') type?: 'service' | 'equipment',
    ) {
        return this.centersService.findAllAssets(centerId, userId, type);
    }

    @Get(':id')
    @Public()
    @ApiOperation({ summary: 'Get asset by ID' })
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.centersService.findAssetById(id);
    }

    @Patch(':id')
    @Roles('admin', 'center', 'doctor', 'staff')
    @ApiOperation({ summary: 'Update asset' })
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateAssetDto: Partial<CreateFacilityAssetDto>,
    ) {
        return this.centersService.updateAsset(id, updateAssetDto);
    }

    @Delete(':id')
    @Roles('admin', 'center', 'doctor', 'staff')
    @ApiOperation({ summary: 'Delete asset' })
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.centersService.deleteAsset(id);
    }
}

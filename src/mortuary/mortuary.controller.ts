import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MortuaryService } from './mortuary.service';
import { CreateMortuaryRecordDto, UpdateMortuaryRecordDto } from './dto/mortuary-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('mortuary')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MortuaryController {
    constructor(private readonly mortuaryService: MortuaryService) { }

    @Post()
    @Roles('center', 'mortuary', 'admin')
    create(@Body() createDto: CreateMortuaryRecordDto) {
        return this.mortuaryService.create(createDto);
    }

    @Get()
    @Roles('center', 'mortuary', 'admin')
    findAll(@Query('centerId') centerId: string) {
        return this.mortuaryService.findAll(centerId);
    }

    @Get(':id')
    @Roles('center', 'mortuary', 'admin')
    findOne(@Param('id') id: string) {
        return this.mortuaryService.findOne(id);
    }

    @Patch(':id')
    @Roles('center', 'mortuary', 'admin')
    update(@Param('id') id: string, @Body() updateDto: UpdateMortuaryRecordDto) {
        return this.mortuaryService.update(id, updateDto);
    }

    @Delete(':id')
    @Roles('admin')
    remove(@Param('id') id: string) {
        return this.mortuaryService.remove(id);
    }
}

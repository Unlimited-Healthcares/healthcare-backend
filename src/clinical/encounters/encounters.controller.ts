import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Request } from '@nestjs/common';
import { EncountersService } from './encounters.service';
import { CreateEncounterDto, UpdateEncounterDto } from './dto/encounter.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('clinical/encounters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EncountersController {
    constructor(private readonly encountersService: EncountersService) { }

    @Post()
    @Roles('doctor', 'nurse', 'admin')
    create(@Body() createEncounterDto: CreateEncounterDto, @Request() req) {
        return this.encountersService.create(createEncounterDto, req.user.userId);
    }

    @Get()
    findAll(@Query() filters, @Request() req) {
        if (req.user.roles.includes('patient')) {
            filters.patientId = req.user.userId;
        }
        return this.encountersService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.encountersService.findOne(id);
    }

    @Patch(':id')
    @Roles('doctor', 'nurse', 'admin')
    update(@Param('id') id: string, @Body() updateEncounterDto: UpdateEncounterDto) {
        return this.encountersService.update(id, updateEncounterDto);
    }

    @Post(':id/complete')
    @Roles('doctor', 'nurse', 'admin')
    complete(@Param('id') id: string) {
        return this.encountersService.complete(id);
    }
}

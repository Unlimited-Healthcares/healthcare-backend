import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Request } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto, UpdatePrescriptionDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('clinical/prescriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrescriptionsController {
    constructor(private readonly prescriptionsService: PrescriptionsService) { }

    @Post()
    @Roles('doctor', 'admin')
    create(@Body() createPrescriptionDto: CreatePrescriptionDto, @Request() req) {
        return this.prescriptionsService.create(createPrescriptionDto, req.user.userId);
    }

    @Get()
    findAll(@Query() filters, @Request() req) {
        if (req.user.roles.includes('patient')) {
            filters.patientId = req.user.userId;
        }
        return this.prescriptionsService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.prescriptionsService.findOne(id);
    }

    @Patch(':id')
    @Roles('doctor', 'admin')
    update(@Param('id') id: string, @Body() updatePrescriptionDto: UpdatePrescriptionDto) {
        return this.prescriptionsService.update(id, updatePrescriptionDto);
    }
}

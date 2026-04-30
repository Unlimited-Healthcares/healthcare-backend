import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { RehabService } from './rehab.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('clinical/rehab')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RehabController {
    constructor(private readonly rehabService: RehabService) { }

    @Post()
    @Roles('allied_practitioner', 'doctor', 'admin')
    create(@Body() data: any, @Request() req) {
        return this.rehabService.create(data, req.user.userId);
    }

    @Get()
    findAll(@Query() filters, @Request() req) {
        if (req.user.roles.includes('patient')) {
            filters.patientId = req.user.userId;
        }
        return this.rehabService.findAll(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rehabService.findOne(id);
    }

    @Post(':id/progress')
    @Roles('patient', 'admin')
    logProgress(@Param('id') id: string, @Body() log: any) {
        return this.rehabService.logProgress(id, log);
    }
}

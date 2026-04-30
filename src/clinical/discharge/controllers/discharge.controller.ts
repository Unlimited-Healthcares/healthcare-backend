import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { DischargeService } from '../services/discharge.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';
import { Roles } from '../../../auth/decorators/roles.decorator';

@Controller('clinical/discharge')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DischargeController {
    constructor(private readonly dischargeService: DischargeService) { }

    @Post()
    @Roles('doctor', 'admin')
    create(@Body() planData: any, @Request() req) {
        return this.dischargeService.createPlan(planData, req.user.userId);
    }

    @Get()
    findAll(@Query() filters) {
        return this.dischargeService.getPlans(filters);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.dischargeService.getPlanById(id);
    }
}

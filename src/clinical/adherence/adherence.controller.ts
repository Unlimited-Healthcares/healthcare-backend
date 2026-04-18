import { Controller, Get, Post, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { AdherenceService } from './adherence.service';
import { CreateAdherenceDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('clinical/adherence')
@UseGuards(JwtAuthGuard)
export class AdherenceController {
    constructor(private readonly adherenceService: AdherenceService) { }

    @Post()
    create(@Body() createAdherenceDto: CreateAdherenceDto) {
        return this.adherenceService.create(createAdherenceDto);
    }

    @Post(':id/taken')
    markAsTaken(@Param('id') id: string) {
        return this.adherenceService.markAsTaken(id);
    }

    @Get('schedule')
    getSchedule(@Query('date') date: string, @Request() req) {
        const queryDate = date ? new Date(date) : new Date();
        return this.adherenceService.getPatientSchedule(req.user.userId, queryDate);
    }
}

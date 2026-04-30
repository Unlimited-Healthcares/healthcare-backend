import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { BiotechService } from './biotech.service';
import { EquipmentStatus } from './entities/equipment.entity';
import { TicketStatus } from './entities/maintenance-ticket.entity';

@Controller('biotech')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BiotechController {
    constructor(private readonly biotechService: BiotechService) { }

    @Get('equipment')
    @Roles('admin', 'biotech', 'staff', 'center')
    async getEquipment(@Request() req) {
        // In a real scenario, we'd extract centerId from the user's profile/context
        const centerId = req.user.centerId || req.query.centerId; 
        return await this.biotechService.findAllEquipment(centerId);
    }

    @Put('equipment/:id/status')
    @Roles('admin', 'biotech')
    async updateStatus(
        @Param('id') id: string,
        @Body() body: { status: EquipmentStatus; metadata?: any }
    ) {
        return await this.biotechService.updateEquipmentStatus(id, body.status, body.metadata);
    }

    @Post('tickets')
    @Roles('admin', 'doctor', 'nurse', 'biotech', 'staff')
    async createTicket(@Body() body: any, @Request() req) {
        return await this.biotechService.createTicket({
            ...body,
            reporterId: req.user.id
        });
    }

    @Get('tickets')
    @Roles('admin', 'biotech', 'staff')
    async getTickets(@Request() req) {
        const centerId = req.user.centerId || req.query.centerId;
        return await this.biotechService.findAllTickets(centerId);
    }

    @Put('tickets/:id/resolve')
    @Roles('admin', 'biotech')
    async resolveTicket(
        @Param('id') id: string,
        @Body() body: { status: TicketStatus; notes?: string }
    ) {
        return await this.biotechService.updateTicketStatus(id, body.status, body.notes);
    }
}

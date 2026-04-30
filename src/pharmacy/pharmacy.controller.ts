import { Controller, Get, Post, Put, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PharmacyService } from './pharmacy.service';

@Controller('pharmacy')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PharmacyController {
    constructor(private readonly pharmacyService: PharmacyService) { }

    @Get('inventory')
    @Roles('admin', 'pharmacist', 'staff', 'center')
    async getInventory(@Request() req, @Query('centerId') queryCenterId?: string) {
        const centerId = req.user.centerId || queryCenterId;
        return await this.pharmacyService.findAll(centerId);
    }

    @Post('inventory')
    @Roles('admin', 'pharmacist')
    async createItem(@Body() body: any, @Request() req) {
        return await this.pharmacyService.create({
            ...body,
            centerId: req.user.centerId || body.centerId
        });
    }

    @Put('inventory/:id/stock')
    @Roles('admin', 'pharmacist')
    async updateStock(
        @Param('id') id: string,
        @Body() body: { adjustment: number }
    ) {
        return await this.pharmacyService.updateStock(id, body.adjustment);
    }
}

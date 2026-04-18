import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ConsentsService } from './consents.service';
import { CreateConsentDto } from './dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('clinical/consents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsentsController {
    constructor(private readonly consentsService: ConsentsService) { }

    @Post()
    @Roles('admin', 'doctor')
    create(@Body() createConsentDto: CreateConsentDto) {
        return this.consentsService.create(createConsentDto);
    }

    @Post(':id/sign')
    sign(@Param('id') id: string, @Request() req) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        return this.consentsService.sign(id, ipAddress);
    }

    @Get('patient/:patientId')
    getPatientConsents(@Param('patientId') patientId: string) {
        return this.consentsService.getPatientConsents(patientId);
    }

    @Get('my-consents')
    getMyConsents(@Request() req) {
        return this.consentsService.getPatientConsents(req.user.userId);
    }
}

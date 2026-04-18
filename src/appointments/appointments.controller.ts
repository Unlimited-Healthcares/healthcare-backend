import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseUUIDPipe,
  ParseIntPipe,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CreateRecurringAppointmentDto } from './dto/create-recurring-appointment.dto';
import { CreateAppointmentTypeDto } from './dto/create-appointment-type.dto';
import { CreateProviderAvailabilityDto } from './dto/create-provider-availability.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { ProfessionalLicenseGuard } from './guards/professional-license.guard';

@ApiTags('appointments')
@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) { }

  @Post()
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @UseGuards(ProfessionalLicenseGuard)
  create(
    @Body() createAppointmentDto: CreateAppointmentDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.appointmentsService.create(createAppointmentDto, userId);
  }

  @Get()
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  findAll(
    @GetCurrentUserId() currentUserId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('centerId') centerId?: string,
    @Query('providerId') providerId?: string,
    @Query('patientId') patientId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    // Validate UUID parameters if provided
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (centerId && !uuidRegex.test(centerId)) {
      throw new BadRequestException('Invalid centerId format');
    }

    // Auto-filter by current user for non-admins if no specific ID is provided
    let effectiveUserId = userId;
    // If no specific professional/patient filters are provided, search by the user's general involvement
    if (!centerId && !providerId && !patientId && !userId) {
      effectiveUserId = currentUserId;
    }

    return this.appointmentsService.findAll({
      centerId,
      providerId,
      patientId,
      userId: effectiveUserId,
      status,
      startDate: dateFrom ? new Date(dateFrom) : undefined,
      endDate: dateTo ? new Date(dateTo) : undefined,
      page,
      limit,
    });
  }

  @Get('types/center/:centerId')
  @Roles('admin', 'doctor', 'staff', 'center')
  getAppointmentTypes(@Param('centerId', ParseUUIDPipe) centerId: string) {
    return this.appointmentsService.getAppointmentTypes(centerId);
  }

  @Post('types/center/:centerId')
  @Roles('admin', 'doctor', 'staff', 'center')
  createAppointmentType(
    @Param('centerId', ParseUUIDPipe) centerId: string,
    @Body() createAppointmentTypeDto: CreateAppointmentTypeDto,
  ) {
    return this.appointmentsService.createAppointmentType(centerId, createAppointmentTypeDto);
  }

  @Get('availability/provider/:providerId')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  getProviderAvailability(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Query('date') date?: string,
  ) {
    return this.appointmentsService.getProviderAvailability(providerId, date);
  }

  @Post('availability')
  @Roles('admin', 'doctor', 'staff', 'center')
  createProviderAvailability(
    @Body() createAvailabilityDto: CreateProviderAvailabilityDto,
  ) {
    return this.appointmentsService.createProviderAvailability(createAvailabilityDto);
  }

  @Patch('availability/:id')
  @Roles('admin', 'doctor', 'staff', 'center')
  @ApiOperation({ summary: 'Update provider availability' })
  @ApiResponse({ status: 200, description: 'Provider availability updated successfully.' })
  @ApiResponse({ status: 404, description: 'Provider availability not found.' })
  updateProviderAvailability(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAvailabilityDto: Partial<CreateProviderAvailabilityDto>,
  ) {
    return this.appointmentsService.updateProviderAvailability(id, updateAvailabilityDto);
  }

  @Get('slots/provider/:providerId')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  getAvailableTimeSlots(
    @Param('providerId', ParseUUIDPipe) providerId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableTimeSlots(providerId, date);
  }

  @Get('reminders/pending')
  @Roles('admin', 'doctor', 'staff', 'center')
  getPendingReminders() {
    return this.appointmentsService.getPendingReminders();
  }

  @Patch('reminders/:reminderId/sent')
  @Roles('admin', 'doctor', 'staff', 'center')
  @ApiOperation({ summary: 'Mark a reminder as sent' })
  @ApiResponse({
    status: 200,
    description: 'Reminder successfully marked as sent.',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Reminder for appointment 123e4567-e89b-12d3-a456-426614174000 marked as sent successfully' },
        reminder: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            appointmentId: { type: 'string', format: 'uuid' },
            recipientId: { type: 'string', format: 'uuid' },
            reminderType: { type: 'string' },
            deliveryMethod: { type: 'string' },
            scheduledFor: { type: 'string', format: 'date-time' },
            sentAt: { type: 'string', format: 'date-time' },
            deliveryStatus: { type: 'string', example: 'sent' },
            messageContent: { type: 'string' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Reminder not found.' })
  markReminderSent(@Param('reminderId', ParseUUIDPipe) reminderId: string) {
    return this.appointmentsService.markReminderSent(reminderId);
  }

  @Post('reminders')
  @Roles('admin', 'doctor', 'staff', 'center')
  @ApiOperation({ summary: 'Create a manual reminder for an appointment' })
  @ApiResponse({ status: 201, description: 'Reminder successfully created.' })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  createReminder(
    @Body() createReminderDto: {
      appointmentId: string;
      reminderType: string;
      reminderTime: string;
      message: string;
      isActive?: boolean;
      priority?: string;
      customMessage?: string;
      deliveryMethod?: string;
    },
  ) {
    return this.appointmentsService.createManualReminder(createReminderDto);
  }

  @Get(':id/ics')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  @ApiOperation({ summary: 'Download appointment as iCalendar (.ics) file' })
  async getICS(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const icsContent = await this.appointmentsService.generateICS(id);

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="appointment-${id}.ics"`);

    return res.send(icsContent);
  }

  @Get(':id')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.appointmentsService.update(id, updateAppointmentDto, userId);
  }

  @Patch(':id/confirm')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.appointmentsService.confirm(id);
  }

  @Patch(':id/cancel')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string; cancelledBy: string },
  ) {
    return this.appointmentsService.cancel(id, body.reason, body.cancelledBy);
  }

  @Patch(':id/complete')
  @Roles('admin', 'doctor', 'staff', 'center')
  @ApiOperation({ summary: 'Mark an appointment as completed' })
  @ApiResponse({ status: 200, description: 'Appointment successfully marked as completed.' })
  @ApiResponse({ status: 404, description: 'Appointment not found.' })
  completeAppointment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completionData: { notes?: string, metadata?: Record<string, unknown> },
  ) {
    return this.appointmentsService.completeAppointment(id, completionData);
  }

  @Delete(':id')
  @Roles('admin', 'doctor', 'staff', 'patient', 'center')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.appointmentsService.remove(id, userId);
  }

  @Post('recurring')
  @Roles('admin', 'doctor', 'staff', 'center')
  @UseGuards(ProfessionalLicenseGuard)
  async createRecurringAppointment(
    @Body() createRecurringDto: CreateRecurringAppointmentDto,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.appointmentsService.createRecurringAppointment(
      createRecurringDto,
      userId,
    );
  }

  @Patch('recurring/:id')
  @Roles('admin', 'doctor', 'staff', 'center')
  async updateRecurringSeries(
    @Param('id') id: string,
    @Body() updateData: Partial<UpdateAppointmentDto>,
    @Query('updateFuture') updateFuture: boolean = false,
    @GetCurrentUserId() userId: string,
  ) {
    // Convert string dates to Date objects if present to match service signature
    const processedUpdateData: Partial<{
      appointmentDate: Date;
      confirmedAt: Date;
      appointmentStatus: string;
      confirmationStatus: string;
      cancellationReason: string;
      metadata: Record<string, unknown>;
      patientId: string;
      centerId: string;
      providerId: string;
      appointmentTypeId: string;
      durationMinutes: number;
      priority: string;
      reason: string;
      notes: string;
      doctor: string;
      isRecurring: boolean;
      recurrencePattern: unknown;
    }> = {};

    // Copy all properties except dates
    Object.keys(updateData).forEach(key => {
      if (key !== 'appointmentDate' && key !== 'confirmedAt') {
        processedUpdateData[key] = updateData[key];
      }
    });

    // Handle date conversions
    if (updateData.appointmentDate) {
      processedUpdateData.appointmentDate = new Date(updateData.appointmentDate);
    }
    if (updateData.confirmedAt) {
      processedUpdateData.confirmedAt = new Date(updateData.confirmedAt);
    }

    return await this.appointmentsService.updateRecurringSeries(
      id,
      processedUpdateData,
      updateFuture,
      userId,
    );
  }

  @Delete('recurring/:id')
  @Roles('admin', 'doctor', 'staff', 'center')
  async cancelRecurringSeries(
    @Param('id') id: string,
    @Query('cancelFuture') cancelFuture: boolean = false,
    @GetCurrentUserId() userId: string,
  ) {
    await this.appointmentsService.cancelRecurringSeries(
      id,
      cancelFuture,
      userId,
    );
    return { message: 'Recurring appointments cancelled successfully' };
  }

  @Get('recurring/:id')
  @Roles('admin', 'doctor', 'staff', 'center')
  async getRecurringAppointments(@Param('id') id: string) {
    return await this.appointmentsService.getRecurringAppointments(id);
  }

  @Get('analytics/:centerId')
  @Roles('admin', 'doctor', 'staff', 'center')
  async getAppointmentAnalytics(
    @Param('centerId') centerId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.appointmentsService.getAppointmentAnalytics(
      centerId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}

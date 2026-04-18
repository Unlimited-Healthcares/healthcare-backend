import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CreateRecurringAppointmentDto } from './dto/create-recurring-appointment.dto';
import { RecurringAppointmentsService } from './recurring-appointments.service';
import { AuditLogService } from '../audit/audit-log.service';
import { AppointmentType } from './entities/appointment-type.entity';
import { ProviderAvailability } from './entities/provider-availability.entity';
import { AppointmentReminder } from './entities/appointment-reminder.entity';
import { CreateAppointmentTypeDto } from './dto/create-appointment-type.dto';
import { CreateProviderAvailabilityDto } from './dto/create-provider-availability.dto';
import { AppointmentParticipant } from './entities/appointment-participant.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CentersService } from '../centers/centers.service';

export interface PaginatedAppointments {
  data: Appointment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentType)
    private readonly appointmentTypeRepository: Repository<AppointmentType>,
    @InjectRepository(ProviderAvailability)
    private readonly providerAvailabilityRepository: Repository<ProviderAvailability>,
    @InjectRepository(AppointmentReminder)
    private readonly appointmentReminderRepository: Repository<AppointmentReminder>,
    @InjectRepository(AppointmentParticipant)
    private readonly participantRepository: Repository<AppointmentParticipant>,
    private readonly recurringAppointmentsService: RecurringAppointmentsService,
    private readonly auditLogService: AuditLogService,
    private readonly notificationsService: NotificationsService,
    private readonly centersService: CentersService,
  ) { }

  async create(
    createAppointmentDto: CreateAppointmentDto,
    userId: string,
  ): Promise<Appointment> {
    const appointment = this.appointmentRepository.create(createAppointmentDto);
    const savedAppointment = await this.appointmentRepository.save(appointment);

    // Log the creation
    await this.auditLogService.log({
      action: 'APPOINTMENT_CREATED',
      entityType: 'appointment',
      entityId: savedAppointment.id,
      userId,
      details: {
        patientId: createAppointmentDto.patientId,
        centerId: createAppointmentDto.centerId,
      },
    });

    // Send notifications to provider (doctor) if available
    if (savedAppointment.providerId) {
      await this.notificationsService.createNotification({
        userId: savedAppointment.providerId,
        title: 'New Appointment Scheduled',
        message: `You have a new appointment scheduled for ${savedAppointment.appointmentDate}. Reason: ${savedAppointment.reason || 'No reason specified'}`,
        type: 'appointment',
        deliveryMethod: 'both', // Both email and push
        relatedType: 'appointment',
        relatedId: savedAppointment.id
      });
    }

    // Notify center owners and staff (Secretariat)
    if (savedAppointment.centerId) {
      try {
        const staff = await this.centersService.findAllStaff(savedAppointment.centerId);
        const managementStaff = staff.filter(s => s.role === 'owner' || s.role === 'staff');

        for (const manager of managementStaff) {
          // Avoid duplicate notification if the owner is also the provider
          if (manager.userId === savedAppointment.providerId) continue;

          await this.notificationsService.createNotification({
            userId: manager.userId,
            title: 'New Appointment Requested',
            message: `A new appointment has been requested at your center for ${savedAppointment.appointmentDate}. Patient: ${userId}`,
            type: 'appointment_requested',
            deliveryMethod: 'email', // Management gets email
            relatedType: 'appointment',
            relatedId: savedAppointment.id
          });
        }
      } catch (error) {
        // Log error but don't fail appointment creation
        console.error('Failed to notify center management:', error);
      }
    }

    // Send notification to patient
    if (userId) {
      await this.notificationsService.createNotification({
        userId,
        title: 'Appointment Scheduled Successfully',
        message: `Your appointment has been scheduled for ${savedAppointment.appointmentDate}.`,
        type: 'appointment',
        deliveryMethod: 'both',
        relatedType: 'appointment',
        relatedId: savedAppointment.id
      });
    }

    // Create automated reminders
    await this.createAutomatedReminders(savedAppointment);

    return savedAppointment;
  }

  private async createAutomatedReminders(appointment: Appointment): Promise<void> {
    const appointmentDate = new Date(appointment.appointmentDate);
    const now = new Date();

    const reminderTimings = [
      { type: 'reminder_24h', hoursBefore: 24 },
      { type: 'reminder_1h', hoursBefore: 1 }
    ];

    for (const timing of reminderTimings) {
      const scheduledFor = new Date(appointmentDate.getTime() - timing.hoursBefore * 60 * 60 * 1000);

      // Only create if the reminder time is in the future (or very recent)
      // and if it hasn't already passed the appointment time
      if (scheduledFor > now || (now.getTime() - scheduledFor.getTime() < 5 * 60 * 1000)) {
        await this.appointmentReminderRepository.save({
          appointmentId: appointment.id,
          recipientId: appointment.patientId,
          reminderType: timing.type,
          deliveryMethod: 'both',
          scheduledFor,
          deliveryStatus: 'pending',
          messageContent: `Reminder: You have an appointment for ${appointment.reason || 'Consultation'} with ${appointment.doctor} scheduled for ${appointment.appointmentDate}.`
        });
      }
    }
  }

  async findAll(filters: {
    centerId?: string;
    patientId?: string;
    providerId?: string;
    userId?: string; // New: Search by any involvement
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<PaginatedAppointments> {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.center', 'center')
      .leftJoinAndSelect('appointment.provider', 'provider')
      .leftJoinAndSelect('appointment.appointmentType', 'appointmentType')
      .leftJoinAndSelect('appointment.participants', 'participants');

    if (filters.centerId) {
      queryBuilder.andWhere('appointment.centerId = :centerId', { centerId: filters.centerId });
    }

    if (filters.patientId) {
      queryBuilder.andWhere('appointment.patientId = :patientId', { patientId: filters.patientId });
    }

    if (filters.providerId) {
      queryBuilder.andWhere('appointment.providerId = :providerId', { providerId: filters.providerId });
    }

    if (filters.userId) {
      queryBuilder.andWhere(
        '(appointment.providerId = :userId OR appointment.patientId = :userId OR participants.participantId = :userId)',
        { userId: filters.userId }
      );
    }

    if (filters.status) {
      queryBuilder.andWhere('appointment.status = :status', { status: filters.status });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('appointment.appointmentDate BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const [appointments, total] = await queryBuilder
      .orderBy('appointment.appointmentDate', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'center', 'provider', 'appointmentType'],
    });
    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }
    return appointment;
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
    userId: string,
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, updateAppointmentDto);
    const updatedAppointment = await this.appointmentRepository.save(appointment);

    // Log the update
    await this.auditLogService.log({
      action: 'APPOINTMENT_UPDATED',
      entityType: 'appointment',
      entityId: id,
      userId,
      details: { ...updateAppointmentDto },
    });

    // Notify user about update
    if (updatedAppointment.patient?.userId || updatedAppointment.patientId) {
      const targetUserId = updatedAppointment.patient?.userId ||
        (await this.appointmentRepository.findOne({
          where: { id: updatedAppointment.id },
          relations: ['patient']
        }))?.patient?.userId;

      if (targetUserId) {
        await this.notificationsService.createNotification({
          userId: targetUserId,
          title: 'Appointment Updated',
          message: `Your appointment for ${updatedAppointment.appointmentType?.name || 'medical service'} has been updated to ${new Date(updatedAppointment.appointmentDate).toLocaleString()}.`,
          type: 'appointment_updated',
          data: { appointmentId: id }
        });
      }
    }

    return updatedAppointment;
  }

  async remove(id: string, userId: string): Promise<void> {
    const appointment = await this.findOne(id);

    // Log the deletion
    await this.auditLogService.log({
      action: 'APPOINTMENT_DELETED',
      entityType: 'appointment',
      entityId: id,
      userId,
      details: { appointmentId: id },
    });

    // Notify patient about cancellation
    if (appointment.patient?.userId || appointment.patientId) {
      const targetUserId = appointment.patient?.userId ||
        (await this.appointmentRepository.findOne({
          where: { id: appointment.id },
          relations: ['patient']
        }))?.patient?.userId;

      if (targetUserId) {
        await this.notificationsService.createNotification({
          userId: targetUserId,
          title: 'Appointment Cancelled',
          message: `Your appointment for ${appointment.appointmentDate.toLocaleString()} has been cancelled.`,
          type: 'appointment_cancelled',
          data: { appointmentId: id }
        });
      }
    }

    await this.appointmentRepository.remove(appointment);
  }

  async createRecurringAppointment(
    createRecurringDto: CreateRecurringAppointmentDto,
    userId: string,
  ): Promise<Appointment[]> {
    const appointments = await this.recurringAppointmentsService.createRecurringAppointments(
      createRecurringDto,
    );

    // Log the creation
    await this.auditLogService.log({
      action: 'RECURRING_APPOINTMENT_CREATED',
      entityType: 'appointment',
      entityId: appointments[0]?.id,
      userId,
      details: {
        patientId: createRecurringDto.patientId,
        centerId: createRecurringDto.centerId,
        recurrencePattern: createRecurringDto.recurrencePattern,
        totalAppointments: appointments.length,
      },
    });

    return appointments;
  }

  async updateRecurringSeries(
    parentAppointmentId: string,
    updateData: Partial<Appointment>,
    updateFuture: boolean,
    userId: string,
  ): Promise<Appointment[]> {
    const updatedAppointments = await this.recurringAppointmentsService.updateRecurringSeries(
      parentAppointmentId,
      updateData,
      updateFuture,
    );

    // Log the series update
    await this.auditLogService.log({
      action: 'RECURRING_SERIES_UPDATED',
      entityType: 'appointment',
      entityId: parentAppointmentId,
      userId,
      details: {
        updateFuture,
        affectedCount: updatedAppointments.length,
      },
    });

    return updatedAppointments;
  }

  async cancelRecurringSeries(
    parentAppointmentId: string,
    cancelFuture: boolean,
    userId: string,
  ): Promise<void> {
    await this.recurringAppointmentsService.cancelRecurringSeries(
      parentAppointmentId,
      cancelFuture,
    );

    // Log the series cancellation
    await this.auditLogService.log({
      action: 'RECURRING_SERIES_CANCELLED',
      entityType: 'appointment',
      entityId: parentAppointmentId,
      userId,
      details: { cancelFuture },
    });
  }

  async getRecurringAppointments(parentAppointmentId: string): Promise<Appointment[]> {
    return await this.recurringAppointmentsService.getRecurringAppointments(
      parentAppointmentId,
    );
  }

  async getAppointmentAnalytics(
    centerId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.center_id = :centerId', { centerId });

    if (startDate && endDate) {
      queryBuilder.andWhere('appointment.appointment_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    const totalAppointments = await queryBuilder.getCount();

    const statusCounts = await queryBuilder
      .select('appointment.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appointment.status')
      .getRawMany();

    const appointmentsByDoctor = await queryBuilder
      .select('appointment.doctor', 'doctor')
      .addSelect('COUNT(*)', 'count')
      .groupBy('appointment.doctor')
      .getRawMany();

    return {
      totalAppointments,
      statusCounts,
      appointmentsByDoctor,
      timeRange: { startDate, endDate },
    };
  }

  async getAppointmentTypes(centerId: string): Promise<AppointmentType[]> {
    return this.appointmentTypeRepository.find({
      where: { centerId }
    });
  }

  async createAppointmentType(
    centerId: string,
    createAppointmentTypeDto: CreateAppointmentTypeDto
  ): Promise<AppointmentType> {
    const appointmentType = this.appointmentTypeRepository.create({
      ...createAppointmentTypeDto,
      centerId,
    });
    return this.appointmentTypeRepository.save(appointmentType);
  }

  async getProviderAvailability(
    providerId: string,
    date?: string
  ): Promise<ProviderAvailability[]> {
    const queryBuilder = this.providerAvailabilityRepository
      .createQueryBuilder('availability')
      .where('availability.providerId = :providerId', { providerId });

    if (date) {
      const targetDate = new Date(date);
      const dayOfWeek = targetDate.getDay();
      queryBuilder.andWhere('availability.dayOfWeek = :dayOfWeek', { dayOfWeek });
    }

    return queryBuilder.getMany();
  }

  async createProviderAvailability(
    createAvailabilityDto: CreateProviderAvailabilityDto
  ): Promise<ProviderAvailability> {
    const availability = this.providerAvailabilityRepository.create(createAvailabilityDto);
    return this.providerAvailabilityRepository.save(availability);
  }

  async updateProviderAvailability(
    id: string,
    updateAvailabilityDto: Partial<CreateProviderAvailabilityDto>
  ): Promise<ProviderAvailability> {
    const availability = await this.providerAvailabilityRepository.findOne({
      where: { id }
    });

    if (!availability) {
      throw new NotFoundException(`Provider availability with ID ${id} not found`);
    }

    Object.assign(availability, updateAvailabilityDto);
    return this.providerAvailabilityRepository.save(availability);
  }

  async getAvailableTimeSlots(providerId: string, date: string): Promise<{
    startTime: string;
    endTime: string;
    duration: number;
  }[]> {
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();

    // Get provider's availability for the day
    const availabilities = await this.providerAvailabilityRepository.find({
      where: {
        providerId,
        dayOfWeek
      }
    });

    if (!availabilities.length) {
      return [];
    }

    // Get existing appointments for that day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await this.appointmentRepository.find({
      where: {
        providerId,
        appointmentDate: Between(startOfDay, endOfDay)
      }
    });

    // Calculate available slots based on availability and existing appointments
    const availableSlots = [];

    for (const availability of availabilities) {
      const { startTime, endTime, slotDurationMinutes } = availability;

      // Convert start and end times to minutes from midnight
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;

      // Generate potential slots
      for (let slotStart = startMinutes; slotStart + slotDurationMinutes <= endMinutes; slotStart += slotDurationMinutes) {
        const slotStartHour = Math.floor(slotStart / 60);
        const slotStartMinute = slotStart % 60;

        const slotDate = new Date(targetDate);
        slotDate.setHours(slotStartHour, slotStartMinute, 0, 0);

        // Check if slot is already booked
        const isSlotAvailable = !existingAppointments.some(appt => {
          const apptStart = appt.appointmentDate;
          const apptEnd = new Date(apptStart);
          apptEnd.setMinutes(apptStart.getMinutes() + appt.durationMinutes);

          return (
            (slotDate >= apptStart && slotDate < apptEnd) ||
            (new Date(slotDate.getTime() + slotDurationMinutes * 60000) > apptStart &&
              new Date(slotDate.getTime() + slotDurationMinutes * 60000) <= apptEnd)
          );
        });

        if (isSlotAvailable) {
          availableSlots.push({
            startTime: slotDate.toISOString(),
            endTime: new Date(slotDate.getTime() + slotDurationMinutes * 60000).toISOString(),
            duration: slotDurationMinutes
          });
        }
      }
    }

    return availableSlots;
  }

  async getPendingReminders(): Promise<AppointmentReminder[]> {
    const now = new Date();

    return this.appointmentReminderRepository.find({
      where: {
        sentAt: null,
        scheduledFor: Between(
          new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24 hours ago
          now
        )
      },
      relations: ['appointment']
    });
  }

  async markReminderSent(reminderId: string): Promise<{
    success: boolean;
    message: string;
    reminder: AppointmentReminder;
  }> {
    const reminder = await this.appointmentReminderRepository.findOne({
      where: { id: reminderId },
      relations: ['appointment']
    });

    if (!reminder) {
      throw new NotFoundException(`Reminder with ID ${reminderId} not found`);
    }

    reminder.sentAt = new Date();
    reminder.deliveryStatus = 'sent';

    const updatedReminder = await this.appointmentReminderRepository.save(reminder);

    return {
      success: true,
      message: `Reminder for appointment ${reminder.appointmentId} marked as sent successfully`,
      reminder: updatedReminder
    };
  }

  async createManualReminder(createReminderDto: {
    appointmentId: string;
    reminderType: string;
    reminderTime: string;
    message: string;
    isActive?: boolean;
    priority?: string;
    customMessage?: string;
    deliveryMethod?: string;
  }): Promise<AppointmentReminder> {
    const appointment = await this.findOne(createReminderDto.appointmentId);

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${createReminderDto.appointmentId} not found`);
    }

    const scheduledFor = new Date(createReminderDto.reminderTime);

    const reminder = this.appointmentReminderRepository.create({
      appointmentId: appointment.id,
      recipientId: appointment.patientId,
      reminderType: createReminderDto.reminderType,
      scheduledFor,
      deliveryMethod: createReminderDto.deliveryMethod || 'email',
      messageContent: createReminderDto.customMessage || createReminderDto.message,
      deliveryStatus: 'pending'
    });

    return this.appointmentReminderRepository.save(reminder);
  }

  async confirm(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    appointment.appointmentStatus = 'confirmed';
    appointment.confirmationStatus = 'confirmed';
    appointment.confirmedAt = new Date();

    return this.appointmentRepository.save(appointment);
  }

  async cancel(id: string, reason: string, cancelledBy: string): Promise<Appointment> {
    const appointment = await this.findOne(id);

    appointment.appointmentStatus = 'cancelled';
    appointment.cancellationReason = reason;
    appointment.cancelledBy = cancelledBy;
    appointment.cancelledAt = new Date();

    return this.appointmentRepository.save(appointment);
  }

  async completeAppointment(
    id: string,
    completionData: { notes?: string, metadata?: Record<string, unknown> }
  ): Promise<Appointment> {
    const appointment = await this.findOne(id);

    appointment.appointmentStatus = 'completed';

    if (completionData.notes) {
      appointment.notes = completionData.notes;
    }

    if (completionData.metadata) {
      appointment.metadata = {
        ...appointment.metadata,
        ...completionData.metadata,
        completedAt: new Date().toISOString()
      };
    }

    return this.appointmentRepository.save(appointment);
  }

  async generateICS(id: string): Promise<string> {
    const appointment = await this.findOne(id);

    const startDate = new Date(appointment.appointmentDate);
    const endDate = new Date(startDate.getTime() + appointment.durationMinutes * 60000);

    const formatDateICS = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//UnlimitedHealthcare//NONSGML v1.0//EN',
      'BEGIN:VEVENT',
      `UID:${appointment.id}`,
      `DTSTAMP:${formatDateICS(new Date())}`,
      `DTSTART:${formatDateICS(startDate)}`,
      `DTEND:${formatDateICS(endDate)}`,
      `SUMMARY:Medical Appointment with ${appointment.doctor}`,
      `DESCRIPTION:Reason: ${appointment.reason}. Notes: ${appointment.notes || 'None'}`,
      `LOCATION:${appointment.center?.name || 'Medical Center'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return icsContent;
  }

  async addParticipant(appointmentId: string, participantId: string, type: string = 'provider'): Promise<AppointmentParticipant> {
    const participant = this.participantRepository.create({
      appointmentId,
      participantId,
      participantType: type,
      isRequired: true,
      attendanceStatus: 'expected',
    });
    return this.participantRepository.save(participant);
  }
}

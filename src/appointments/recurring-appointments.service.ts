import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateRecurringAppointmentDto } from './dto/create-recurring-appointment.dto';

@Injectable()
export class RecurringAppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
  ) {}

  async createRecurringAppointments(
    createRecurringDto: CreateRecurringAppointmentDto,
  ): Promise<Appointment[]> {
    const { recurrencePattern, ...baseAppointmentData } = createRecurringDto;
    
    // Generate appointment dates based on recurrence pattern
    const appointmentDates = this.generateRecurringDates(
      new Date(createRecurringDto.appointmentDate),
      recurrencePattern,
    );

    const createdAppointments: Appointment[] = [];
    let parentAppointmentId: string | null = null;

    for (const [index, date] of appointmentDates.entries()) {
      const appointmentData = {
        ...baseAppointmentData,
        appointmentDate: date,
        isRecurring: true,
        recurrencePattern,
        parentAppointmentId: index === 0 ? null : parentAppointmentId,
        status: 'scheduled',
      };

      const appointment = this.appointmentRepository.create(appointmentData);
      const savedAppointment = await this.appointmentRepository.save(appointment);
      
      // Set the first appointment as the parent
      if (index === 0) {
        parentAppointmentId = savedAppointment.id;
      }

      createdAppointments.push(savedAppointment);
    }

    return createdAppointments;
  }

  async updateRecurringSeries(
    parentAppointmentId: string,
    updateData: Partial<Appointment>,
    updateFuture: boolean = false,
  ): Promise<Appointment[]> {
    if (updateFuture) {
      // Update all future appointments in the series
      const futureAppointments = await this.appointmentRepository.find({
        where: {
          parentAppointmentId,
          appointmentDate: new Date(), // This would need proper date comparison
        },
      });

      const updatedAppointments: Appointment[] = [];
      for (const appointment of futureAppointments) {
        Object.assign(appointment, updateData);
        updatedAppointments.push(await this.appointmentRepository.save(appointment));
      }

      return updatedAppointments;
    } else {
      // Update only the parent appointment
      const parentAppointment = await this.appointmentRepository.findOne({
        where: { id: parentAppointmentId },
      });

      if (parentAppointment) {
        Object.assign(parentAppointment, updateData);
        return [await this.appointmentRepository.save(parentAppointment)];
      }

      return [];
    }
  }

  async cancelRecurringSeries(
    parentAppointmentId: string,
    cancelFuture: boolean = false,
  ): Promise<void> {
    if (cancelFuture) {
      // Cancel all future appointments
      await this.appointmentRepository.update(
        {
          parentAppointmentId,
          appointmentDate: new Date(), // This would need proper date comparison
        },
        {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      );
    } else {
      // Cancel only the parent appointment
      await this.appointmentRepository.update(
        { id: parentAppointmentId },
        {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      );
    }
  }

  private generateRecurringDates(
    startDate: Date,
    pattern: {
      frequency?: string;
      interval?: number;
      count?: number;
      occurrences?: number;
      endDate?: string;
      daysOfWeek?: string[];
      dayOfMonth?: number;
    },
  ): Date[] {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    let count = 0;
    const maxOccurrences = pattern.occurrences || 52; // Default to 1 year of weekly appointments
    const endDate = pattern.endDate ? new Date(pattern.endDate) : null;

    while (count < maxOccurrences && (!endDate || currentDate <= endDate)) {
      dates.push(new Date(currentDate));

      // Calculate next date based on frequency
      switch (pattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * pattern.interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + pattern.interval);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + pattern.interval);
          break;
      }

      count++;
    }

    return dates;
  }

  async getRecurringAppointments(parentAppointmentId: string): Promise<Appointment[]> {
    return await this.appointmentRepository.find({
      where: [
        { id: parentAppointmentId },
        { parentAppointmentId },
      ],
      order: { appointmentDate: 'ASC' },
    });
  }
}

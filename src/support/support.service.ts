import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, SupportTicketStatus } from './entities/support-ticket.entity';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { EmailService } from '../email/email.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly supportRepository: Repository<SupportTicket>,
    private readonly emailService: EmailService,
  ) { }

  async createSupportTicket(createDto: CreateSupportTicketDto, userId?: string) {
    try {
      const ticket = this.supportRepository.create({
        ...createDto,
        userId: userId,
        status: SupportTicketStatus.OPEN,
        createdAt: new Date(),
      });

      const savedTicket = await this.supportRepository.save(ticket);

      // Notify support team and user
      try {
        await this.emailService.sendSupportTicketEmail(savedTicket.email, savedTicket);
        console.log(`Support Ticket emails sent for: ${savedTicket.id}`);
      } catch (emailError) {
        console.error('Failed to send support ticket emails:', emailError);
        // We don't fail the ticket creation because of email failure
      }

      return savedTicket;
    } catch (error) {
      console.error('Error creating support ticket:', error);
      throw new InternalServerErrorException('Failed to submit support ticket');
    }
  }

  async getMyTickets(userId: string) {
    return this.supportRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllTickets(limit: number = 20, page: number = 1) {
    const [data, total] = await this.supportRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateTicketStatus(id: string, status: SupportTicketStatus) {
    const ticket = await this.supportRepository.findOneBy({ id });
    if (!ticket) return null;

    ticket.status = status;
    if (status === SupportTicketStatus.RESOLVED || status === SupportTicketStatus.CLOSED) {
      ticket.resolvedAt = new Date();
    }

    return this.supportRepository.save(ticket);
  }
}

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Patch, 
  UseGuards, 
  Query, 
  ParseIntPipe,
  ParseUUIDPipe
} from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';
import { SupportTicketStatus } from './entities/support-ticket.entity';

import { SupportAiService } from './support-ai.service';
import { StartSupportChatDto, ContinueSupportChatDto } from './dto/support-chat.dto';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(
    private readonly supportService: SupportService,
    private readonly supportAiService: SupportAiService
  ) {}

  @Post('chat/start')
  async startChat(
    @Body() dto: StartSupportChatDto,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.supportAiService.startChat(dto, userId);
  }

  @Post('chat/continue')
  async continueChat(
    @Body() dto: ContinueSupportChatDto,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.supportAiService.continueChat(dto, userId);
  }


  @Post('ticket')
  async createTicket(
    @Body() createDto: CreateSupportTicketDto,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.supportService.createSupportTicket(createDto, userId);
  }

  @Get('my-tickets')
  async getMyTickets(@GetCurrentUser('sub') userId: string) {
    return this.supportService.getMyTickets(userId);
  }

  // Admin access to all tickets (requires Admin Guard in a real app)
  @Get('all-tickets')
  async getAllTickets(
    @Query('limit', ParseIntPipe) limit: number = 20,
    @Query('page', ParseIntPipe) page: number = 1,
  ) {
    return this.supportService.getAllTickets(limit, page);
  }

  @Patch('ticket/:id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: SupportTicketStatus,
  ) {
    return this.supportService.updateTicketStatus(id, status);
  }
}

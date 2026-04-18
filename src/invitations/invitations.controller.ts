import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { DeclineInvitationDto } from './dto/decline-invitation.dto';
import { Invitation } from './entities/invitation.entity';
import { SafeUserDto } from '../users/dto/safe-user.dto';

interface RequestWithUser {
  user: {
    id: string;
    roles: string[];
  };
}

@ApiTags('invitations')
@Controller('invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post()
  @Roles('admin', 'doctor', 'staff', 'center')
  @ApiOperation({ summary: 'Create an invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created successfully', type: Invitation })
  async createInvitation(
    @Body() createInvitationDto: CreateInvitationDto,
    @Req() req: RequestWithUser,
  ): Promise<Invitation> {
    return this.invitationsService.createInvitation(createInvitationDto, req.user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending invitations for email' })
  @ApiQuery({ name: 'email', description: 'Email address to check for invitations' })
  @ApiResponse({ status: 200, description: 'Pending invitations retrieved', type: [Invitation] })
  async getPendingInvitations(@Query('email') email: string): Promise<Invitation[]> {
    return this.invitationsService.getPendingInvitations(email);
  }

  @Get(':id')
  @Roles('admin', 'center', 'doctor', 'staff')
  @ApiOperation({ summary: 'Get invitation by ID' })
  @ApiParam({ name: 'id', description: 'Invitation ID' })
  @ApiResponse({ status: 200, description: 'Invitation retrieved successfully', type: Invitation })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async getInvitationById(@Param('id') id: string): Promise<Invitation> {
    return this.invitationsService.getInvitationById(id);
  }

  @Get('center/:centerId')
  @Roles('admin', 'center')
  @ApiOperation({ summary: 'Get invitations by center ID' })
  @ApiParam({ name: 'centerId', description: 'Center ID' })
  @ApiQuery({ name: 'page', description: 'Page number', required: false, type: Number })
  @ApiQuery({ name: 'limit', description: 'Items per page', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Center invitations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        invitations: { type: 'array', items: { $ref: '#/components/schemas/Invitation' } },
        total: { type: 'number' },
        page: { type: 'number' },
        hasMore: { type: 'boolean' }
      }
    }
  })
  async getInvitationsByCenter(
    @Param('centerId') centerId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ): Promise<{ invitations: Invitation[]; total: number; page: number; hasMore: boolean }> {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.invitationsService.getInvitationsByCenter(centerId, pageNum, limitNum);
  }

  @Post(':token/accept')
  @ApiOperation({ summary: 'Accept an invitation' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation accepted successfully', type: SafeUserDto })
  async acceptInvitation(
    @Param('token') token: string,
    @Body() acceptDto: AcceptInvitationDto,
  ): Promise<SafeUserDto> {
    return this.invitationsService.acceptInvitationSafe(token, acceptDto);
  }

  @Post(':token/decline')
  @ApiOperation({ summary: 'Decline an invitation' })
  @ApiParam({ name: 'token', description: 'Invitation token' })
  @ApiResponse({ status: 200, description: 'Invitation declined successfully' })
  async declineInvitation(
    @Param('token') token: string,
    @Body() declineDto: DeclineInvitationDto,
  ): Promise<{ message: string }> {
    await this.invitationsService.declineInvitation(token, declineDto);
    return { message: 'Invitation declined successfully' };
  }
}

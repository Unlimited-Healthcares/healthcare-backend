
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, BadRequestException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCurrentUserId } from '../auth/decorators/get-current-user-id.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { GetNotificationsDto } from './dto/get-notifications.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  async getNotifications(
    @GetCurrentUserId() userId: string,
    @Query() query: GetNotificationsDto,
  ) {
    const { page = 1, limit = 20, type, isRead } = query;
    return await this.notificationsService.getUserNotifications(userId, {
      type,
      isRead,
      page,
      limit,
    });
  }

  @Get('unread-count')
  async getUnreadCount(@GetCurrentUserId() userId: string) {
    return await this.notificationsService.getUnreadCount(userId);
  }

  @Get('kpis')
  async getKPIs(@GetCurrentUserId() userId: string) {
    return await this.notificationsService.getKPIs(userId);
  }

  @Post()
  @Roles('admin', 'doctor', 'staff', 'patient')
  async createNotification(@Body() createNotificationDto: CreateNotificationDto, @GetCurrentUserId() currentUserId: string, @Req() req) {
    // Get user roles from request
    const userRoles = req.user?.roles || [];
    const isPatient = userRoles.includes('patient');

    // If patient is creating notification, restrict to specific types and recipients
    if (isPatient) {
      if (createNotificationDto.userId && createNotificationDto.userId !== currentUserId) {
        // Patients can only create notifications for themselves
        createNotificationDto.userId = currentUserId;
      }

      // Restrict patient notification types to safe ones
      const allowedPatientTypes = ['message', 'emergency', 'appointment_request'];
      if (createNotificationDto.type && !allowedPatientTypes.includes(createNotificationDto.type)) {
        throw new BadRequestException('Patients can only create message, emergency, or appointment_request notifications');
      }
    }

    return await this.notificationsService.createNotification(createNotificationDto);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @GetCurrentUserId() userId: string) {
    return await this.notificationsService.markAsRead(id, userId);
  }

  @Put('mark-all-read')
  async markAllAsRead(@GetCurrentUserId() userId: string) {
    return await this.notificationsService.markAllAsRead(userId);
  }

  @Delete('clear-all')
  async clearAllNotifications(@GetCurrentUserId() userId: string) {
    return await this.notificationsService.deleteAllNotifications(userId);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @GetCurrentUserId() userId: string) {
    return await this.notificationsService.deleteNotification(id, userId);
  }

  @Get('preferences')
  async getPreferences(@GetCurrentUserId() userId: string) {
    return await this.notificationsService.getUserPreferences(userId);
  }

  @Put('preferences')
  async updatePreferences(
    @GetCurrentUserId() userId: string,
    @Body() updatePreferencesDto: UpdateNotificationPreferencesDto,
  ) {
    return await this.notificationsService.updateUserPreferences(userId, updatePreferencesDto);
  }

  @Post('test/:type')
  async sendTestNotification(
    @Param('type') type: string,
    @GetCurrentUserId() userId: string,
  ) {
    return await this.notificationsService.sendTestNotification(userId, type);
  }

  @Post('broadcast')
  @Roles('admin')
  @ApiOperation({ summary: 'Broadcast targeted notifications (admin only)' })
  async broadcastNotification(
    @Body() body: { notification: CreateNotificationDto, target: { roles?: string[], userIds?: string[] } }
  ) {
    if (!body.notification || !body.target) {
      throw new BadRequestException('Notification and target are required');
    }
    return await this.notificationsService.broadcast(body.notification, body.target);
  }
}

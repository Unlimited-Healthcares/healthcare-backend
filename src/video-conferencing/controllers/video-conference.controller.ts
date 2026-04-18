import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetCurrentUserId } from '../../auth/decorators/get-current-user-id.decorator';

@ApiTags('video-conferencing')
@Controller('video-conference')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class VideoConferenceController {
  
  @Get()
  @ApiOperation({ summary: 'Get video conference gateway information' })
  @ApiResponse({ status: 200, description: 'Video conference gateway data retrieved successfully' })
  async getVideoConferenceGatewayData(@GetCurrentUserId() userId: string) {
    // Return basic video conference gateway information for HTTP requests
    return {
      message: 'Video conference WebSocket gateway is available',
      userId,
      timestamp: new Date().toISOString(),
      websocketNamespace: '/video-conference'
    };
  }
} 
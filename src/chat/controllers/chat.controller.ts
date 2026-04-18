
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  ParseUUIDPipe,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiQuery 
} from '@nestjs/swagger';
import { ChatService } from '../services/chat.service';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetCurrentUserId } from '../../auth/decorators/get-current-user-id.decorator';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @ApiOperation({ summary: 'Get chat rooms and messages' })
  @ApiResponse({ status: 200, description: 'Chat data retrieved successfully' })
  async getChatData(@GetCurrentUserId() userId: string) {
    // Return basic chat information for HTTP requests
    return {
      message: 'Chat WebSocket gateway is available',
      userId,
      timestamp: new Date().toISOString(),
      websocketNamespace: '/chat'
    };
  }

  @Post('rooms')
  @ApiOperation({ summary: 'Create a new chat room' })
  @ApiResponse({ status: 201, description: 'Chat room created successfully' })
  createRoom(
    @Body() createChatRoomDto: CreateChatRoomDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.chatService.createChatRoom(createChatRoomDto, userId);
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Get user chat rooms' })
  @ApiResponse({ status: 200, description: 'Chat rooms retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getUserRooms(
    @GetCurrentUserId() userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getUserChatRooms(userId, page, limit);
  }

  @Get('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Get chat room messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  getRoomMessages(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @GetCurrentUserId() userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.chatService.getChatRoomMessages(roomId, userId, page, limit);
  }

  @Post('rooms/:roomId/messages')
  @ApiOperation({ summary: 'Send a message to chat room' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  sendMessage(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() sendMessageDto: SendMessageDto,
    @GetCurrentUserId() userId: string,
  ) {
    return this.chatService.sendMessage(roomId, sendMessageDto, userId);
  }

  @Post('messages/:messageId/reactions')
  @ApiOperation({ summary: 'Add or remove reaction to message' })
  @ApiResponse({ status: 200, description: 'Reaction updated successfully' })
  toggleReaction(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body('reaction') reaction: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.chatService.addReaction(messageId, reaction, userId);
  }

  @Patch('messages/:messageId')
  @ApiOperation({ summary: 'Edit a message (within 3 minutes of sending)' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 403, description: 'Message can only be edited within 3 minutes of sending' })
  editMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @Body('content') content: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.chatService.editMessage(messageId, content, userId);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  deleteMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.chatService.deleteMessage(messageId, userId);
  }

  @Post('rooms/:roomId/participants')
  @ApiOperation({ summary: 'Add participant to chat room' })
  @ApiResponse({ status: 201, description: 'Participant added successfully' })
  addParticipant(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body('userId', ParseUUIDPipe) userIdToAdd: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.chatService.addParticipant(roomId, userIdToAdd, userId);
  }

  @Delete('rooms/:roomId/participants/:participantId')
  @ApiOperation({ summary: 'Remove participant from chat room' })
  @ApiResponse({ status: 200, description: 'Participant removed successfully' })
  removeParticipant(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
    @GetCurrentUserId() userId: string,
  ) {
    return this.chatService.removeParticipant(roomId, participantId, userId);
  }
}

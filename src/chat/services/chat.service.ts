import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { ChatParticipant } from '../entities/chat-participant.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { ChatMessageReaction } from '../entities/chat-message-reaction.entity';
import { CreateChatRoomDto } from '../dto/create-chat-room.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { AuditService } from '../../audit/audit.service';
import { User } from '../../users/entities/user.entity';
// import { v4 as uuidv4 } from 'uuid'; // Unused import

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private chatRoomRepository: Repository<ChatRoom>,
    @InjectRepository(ChatParticipant)
    private participantRepository: Repository<ChatParticipant>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(ChatMessageReaction)
    private reactionRepository: Repository<ChatMessageReaction>,
    private auditService: AuditService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Set the DM room name to the other participant's display name
   * @param room - The chat room with participants loaded
   * @param currentUserId - The user requesting the room
   * @returns The room with name set to other participant's display name
   */
  private setDMDisplayName(room: ChatRoom, currentUserId: string): ChatRoom {
    if (room.type === 'direct' && room.participants?.length === 2) {
      const otherParticipant = room.participants.find(p => p.userId !== currentUserId);
      if (otherParticipant?.user?.profile) {
        const displayName = otherParticipant.user.profile.displayName || 
                           `${otherParticipant.user.profile.firstName || ''} ${otherParticipant.user.profile.lastName || ''}`.trim();
        if (displayName) {
          room.name = displayName;
        }
      }
    }
    return room;
  }

  async createChatRoom(createChatRoomDto: CreateChatRoomDto, createdBy: string) {
    const { participantIds, ...roomData } = createChatRoomDto;

    // Normalize type casing to stored enum format (lowercase in entities)
    const roomType = roomData.type;

    if (roomType === 'direct') {
      // Validation: must be exactly two unique users (creator + other)
      const uniqueParticipants = Array.from(new Set([...(participantIds || []), createdBy]));
      if (uniqueParticipants.length !== 2) {
        throw new BadRequestException('Direct messages must include exactly two distinct users');
      }

      const [userA, userB] = uniqueParticipants.sort();
      if (userA === userB || createdBy === userB && createdBy === userA) {
        throw new BadRequestException('You cannot create a direct message with yourself');
      }

      // Transaction to avoid race conditions; also lock user rows to serialize per pair
      return await this.dataSource.transaction(async manager => {
        // Verify both users exist and are active (and lock their rows)
        const users = await manager.getRepository(User).find({
          where: [{ id: userA }, { id: userB }],
        });
        if (users.length !== 2 || !users.every(u => u.isActive)) {
          throw new NotFoundException('One or more users not found or inactive');
        }

        // Acquire row locks on both users to serialize DM creation for this pair
        await manager.query('SELECT id FROM users WHERE id IN ($1, $2) FOR UPDATE', [userA, userB]);

        // Check for existing active direct room between the two users
        const existingActive = await manager
          .getRepository(ChatRoom)
          .createQueryBuilder('room')
          .innerJoin('room.participants', 'p')
          .where('room.type = :type', { type: 'direct' })
          .andWhere('room.isActive = true')
          .andWhere('p.userId IN (:...ids)', { ids: [userA, userB] })
          .groupBy('room.id')
          .having('COUNT(DISTINCT p.userId) = 2')
          .getOne();

        if (existingActive) {
          const roomWithDetails = await manager.getRepository(ChatRoom)
            .createQueryBuilder('room')
            .where('room.id = :id', { id: existingActive.id })
            .leftJoinAndSelect('room.participants', 'participant')
            .leftJoinAndSelect('participant.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('room.messages', 'messages')
            .getOne();
          
          // Set display name to other participant's name
          this.setDMDisplayName(roomWithDetails, createdBy);
          
          return {
            room: roomWithDetails,
            action: 'found',
            message: 'Existing room found',
          } as const;
        }

        // Check for archived/inactive direct room and reactivate if found
        const existingArchived = await manager
          .getRepository(ChatRoom)
          .createQueryBuilder('room')
          .innerJoin('room.participants', 'p')
          .where('room.type = :type', { type: 'direct' })
          .andWhere('room.isActive = false')
          .andWhere('p.userId IN (:...ids)', { ids: [userA, userB] })
          .groupBy('room.id')
          .having('COUNT(DISTINCT p.userId) = 2')
          .getOne();

        if (existingArchived) {
          await manager.getRepository(ChatRoom).update(existingArchived.id, { isActive: true, updatedAt: new Date() });

          const partsRepo = manager.getRepository(ChatParticipant);
          // Reactivate or create participants for both users
          for (const uid of [userA, userB]) {
            const part = await partsRepo.findOne({ where: { roomId: existingArchived.id, userId: uid } });
            if (part) {
              if (!part.isActive) {
                part.isActive = true;
                part.leftAt = null;
                part.joinedAt = new Date();
                await partsRepo.save(part);
              }
            } else {
              await partsRepo.save(partsRepo.create({ roomId: existingArchived.id, userId: uid, role: uid === createdBy ? 'admin' : 'participant' }));
            }
          }

          const roomWithDetails = await manager.getRepository(ChatRoom)
            .createQueryBuilder('room')
            .where('room.id = :id', { id: existingArchived.id })
            .leftJoinAndSelect('room.participants', 'participant')
            .leftJoinAndSelect('participant.user', 'user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('room.messages', 'messages')
            .getOne();

          // Set display name to other participant's name
          this.setDMDisplayName(roomWithDetails, createdBy);

          await this.auditService.logActivity(
            createdBy,
            'chat_room',
            'REACTIVATE_CHAT_ROOM',
            'Direct chat room reactivated',
            { roomId: existingArchived.id, type: 'direct' }
          );

          return {
            room: roomWithDetails,
            action: 'found',
            message: 'Existing room found',
          } as const;
        }

        // Create new direct room
        const chatRoom = manager.getRepository(ChatRoom).create({
          ...roomData,
          type: 'direct',
          createdBy,
          isActive: true,
        });
        const savedRoom = await manager.getRepository(ChatRoom).save(chatRoom);

        const partsRepo = manager.getRepository(ChatParticipant);
        const participantsToCreate = [userA, userB].map(uid =>
          partsRepo.create({
            roomId: savedRoom.id,
            userId: uid,
            role: uid === createdBy ? 'admin' : 'participant',
          })
        );
        await partsRepo.save(participantsToCreate);

        await this.auditService.logActivity(
          createdBy,
          'chat_room',
          'CREATE_CHAT_ROOM',
          'Direct chat room created',
          { roomId: savedRoom.id, type: 'direct', participants: 2 }
        );

        const roomWithDetails = await manager.getRepository(ChatRoom)
          .createQueryBuilder('room')
          .where('room.id = :id', { id: savedRoom.id })
          .leftJoinAndSelect('room.participants', 'participant')
          .leftJoinAndSelect('participant.user', 'user')
          .leftJoinAndSelect('user.profile', 'profile')
          .leftJoinAndSelect('room.messages', 'messages')
          .getOne();

        // Set display name to other participant's name
        this.setDMDisplayName(roomWithDetails, createdBy);

        return {
          room: roomWithDetails,
          action: 'created',
          message: 'Room created successfully',
        } as const;
      });
    }

    // Non-direct room types: preserve existing behavior but wrap response in new format
    const chatRoom = this.chatRoomRepository.create({
      ...roomData,
      createdBy,
    });

    const savedRoom = await this.chatRoomRepository.save(chatRoom);

    // Add participants exactly as before
    const participants = (participantIds || []).map(userId =>
      this.participantRepository.create({
        roomId: savedRoom.id,
        userId,
        role: userId === createdBy ? 'admin' : 'participant',
      })
    );
    if (participants.length > 0) {
      await this.participantRepository.save(participants);
    }

    await this.auditService.logActivity(
      createdBy,
      'chat_room',
      'CREATE_CHAT_ROOM',
      'Chat room created',
      { roomId: savedRoom.id, type: roomData.type, participants: participants.length }
    );

    const roomWithDetails = await this.getChatRoomWithDetails(savedRoom.id);
    return {
      room: roomWithDetails,
      action: 'created',
      message: 'Room created successfully',
    } as const;
  }

  async getUserChatRooms(userId: string, page = 1, limit = 20) {
    const [rooms, total] = await this.chatRoomRepository
      .createQueryBuilder('room')
      .leftJoinAndSelect('room.participants', 'participant')
      .leftJoinAndSelect('participant.user', 'participantUser')
      .leftJoinAndSelect('participantUser.profile', 'participantUserProfile')
      .leftJoin('room.messages', 'lastMessage')
      .addSelect(['lastMessage.id', 'lastMessage.content', 'lastMessage.createdAt', 'lastMessage.senderId'])
      .where('participant.userId = :userId AND participant.isActive = true', { userId })
      .andWhere('room.isActive = true')
      .orderBy('room.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: rooms,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getChatRoomMessages(roomId: string, userId: string, page = 1, limit = 50) {
    // Verify user is participant
    await this.verifyUserInRoom(roomId, userId);

    const [messages, total] = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.reactions', 'reaction')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('sender.profile', 'senderProfile')
      .where('message.roomId = :roomId AND message.isDeleted = false', { roomId })
      .orderBy('message.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: messages.reverse(), // Return in chronological order
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async sendMessage(roomId: string, sendMessageDto: SendMessageDto, senderId: string) {
    // Verify user is participant and can send messages
    const participant = await this.verifyUserInRoom(roomId, senderId);
    
    if (!participant.permissions?.can_send_messages) {
      throw new ForbiddenException('You do not have permission to send messages in this room');
    }

    const message = this.messageRepository.create({
      roomId,
      senderId,
      ...sendMessageDto,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update room's updated_at timestamp
    await this.chatRoomRepository.update(roomId, { updatedAt: new Date() });

    await this.auditService.logActivity(
      senderId,
      'chat_message',
      'CREATE_MESSAGE',
      'Message sent',
      { messageId: savedMessage.id, roomId, messageType: sendMessageDto.messageType || 'text' }
    );

    return savedMessage;
  }

  async addReaction(messageId: string, reaction: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      select: ['id', 'roomId'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is in the room
    await this.verifyUserInRoom(message.roomId, userId);

    const existingReaction = await this.reactionRepository.findOne({
      where: { messageId, userId, reaction },
    });

    if (existingReaction) {
      // Remove reaction if it already exists
      await this.reactionRepository.remove(existingReaction);
      return { action: 'removed' };
    } else {
      // Add new reaction
      const newReaction = this.reactionRepository.create({
        messageId,
        userId,
        reaction,
      });
      await this.reactionRepository.save(newReaction);
      return { action: 'added', reaction: newReaction };
    }
  }

  async editMessage(messageId: string, content: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, senderId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found or you do not have permission to edit it');
    }

    // Check if message is within 3-minute edit window
    const EDIT_WINDOW_MINUTES = 3;
    const messageAge = Date.now() - message.createdAt.getTime();
    const editWindowMs = EDIT_WINDOW_MINUTES * 60 * 1000;

    if (messageAge > editWindowMs) {
      throw new ForbiddenException(`Message can only be edited within ${EDIT_WINDOW_MINUTES} minutes of sending`);
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    const updatedMessage = await this.messageRepository.save(message);

    await this.auditService.logActivity(
      userId,
      'chat_message',
      'UPDATE_MESSAGE',
      'Message edited',
      { messageId, content, edited: true, editWindowMs: messageAge }
    );

    return updatedMessage;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
      relations: ['room'],
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is sender or room admin
    const participant = await this.participantRepository.findOne({
      where: { roomId: message.roomId, userId, isActive: true },
    });

    if (!participant || (message.senderId !== userId && participant.role !== 'admin')) {
      throw new ForbiddenException('You do not have permission to delete this message');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = '[Message deleted]';

    await this.messageRepository.save(message);

    await this.auditService.logActivity(
      userId,
      'chat_message',
      'DELETE_MESSAGE',
      'Message deleted',
      { messageId, deleted: true }
    );

    return { success: true };
  }

  async addParticipant(roomId: string, userIdToAdd: string, addedBy: string) {
    // Verify the user adding has admin rights
    const adminParticipant = await this.participantRepository.findOne({
      where: { roomId, userId: addedBy, isActive: true },
    });

    if (!adminParticipant || adminParticipant.role !== 'admin') {
      throw new ForbiddenException('Only room admins can add participants');
    }

    // Check if user is already a participant
    const existingParticipant = await this.participantRepository.findOne({
      where: { roomId, userId: userIdToAdd },
    });

    if (existingParticipant) {
      if (existingParticipant.isActive) {
        throw new ForbiddenException('User is already a participant');
      } else {
        // Reactivate participant
        existingParticipant.isActive = true;
        existingParticipant.joinedAt = new Date();
        return await this.participantRepository.save(existingParticipant);
      }
    }

    const participant = this.participantRepository.create({
      roomId,
      userId: userIdToAdd,
      role: 'participant',
    });

    const savedParticipant = await this.participantRepository.save(participant);

    await this.auditService.logActivity(
      addedBy,
      'chat_participant',
      'ADD_PARTICIPANT',
      'Participant added to chat room',
      { roomId, userAdded: userIdToAdd }
    );

    return savedParticipant;
  }

  async removeParticipant(roomId: string, userIdToRemove: string, removedBy: string) {
    // Verify the user removing has admin rights or is removing themselves
    if (userIdToRemove !== removedBy) {
      const adminParticipant = await this.participantRepository.findOne({
        where: { roomId, userId: removedBy, isActive: true },
      });

      if (!adminParticipant || adminParticipant.role !== 'admin') {
        throw new ForbiddenException('Only room admins can remove other participants');
      }
    }

    const participant = await this.participantRepository.findOne({
      where: { roomId, userId: userIdToRemove, isActive: true },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.isActive = false;
    participant.leftAt = new Date();

    await this.participantRepository.save(participant);

    await this.auditService.logActivity(
      removedBy,
      'chat_participant',
      'REMOVE_PARTICIPANT',
      'Participant removed from chat room',
      { roomId, userRemoved: userIdToRemove, isActive: false, leftAt: new Date() }
    );

    return { success: true };
  }

  private async verifyUserInRoom(roomId: string, userId: string): Promise<ChatParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { roomId, userId, isActive: true },
    });

    if (!participant) {
      throw new ForbiddenException('You are not a participant in this chat room');
    }

    return participant;
  }

  private async getChatRoomWithDetails(roomId: string) {
    return await this.chatRoomRepository.findOne({
      where: { id: roomId },
      relations: ['participants', 'participants.user', 'participants.user.profile', 'messages', 'messages.sender', 'messages.sender.profile'],
    });
  }
}

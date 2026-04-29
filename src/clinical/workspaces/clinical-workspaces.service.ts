import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClinicalWorkspace } from './entities/clinical-workspace.entity';
import { ClinicalLog } from './entities/clinical-log-entry.entity';
import { CreateWorkspaceDto, CreateLogEntryDto } from './dto/workspace.dto';
import { ChatService } from '../../chat/services/chat.service';
import { AuditService } from '../../audit/audit.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class ClinicalWorkspacesService {
  constructor(
    @InjectRepository(ClinicalWorkspace)
    private readonly workspaceRepository: Repository<ClinicalWorkspace>,
    @InjectRepository(ClinicalLog)
    private readonly logRepository: Repository<ClinicalLog>,
    private readonly chatService: ChatService,
    private readonly auditService: AuditService,
    private readonly usersService: UsersService,
  ) {}

  async createWorkspace(createWorkspaceDto: CreateWorkspaceDto, creatorId: string) {
    const { patientId, ...data } = createWorkspaceDto;

    // 1. Create a Chat Room for this workspace
    const chatRoomResult = await this.chatService.createChatRoom({
      name: `${data.title} - Chat`,
      type: 'consultation',
      participantIds: [patientId], // Creator is added automatically by ChatService
    }, creatorId);

    // 2. Initialize the Workspace
    const workspace = this.workspaceRepository.create({
      ...data,
      patientId,
      chatRoomId: chatRoomResult.room.id,
      createdBy: creatorId,
      status: 'active',
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // 3. Create initial log entry
    await this.createLogEntry(savedWorkspace.id, {
      content: `Workspace "${data.title}" initialized by ${creatorId}.`,
      isSystemGenerated: true,
    }, creatorId);

    await this.auditService.logActivity(
      creatorId,
      'clinical_workspace',
      'CREATE_WORKSPACE',
      `Workspace created for patient ${patientId}`,
      { workspaceId: savedWorkspace.id }
    );

    return savedWorkspace;
  }

  async getWorkspacesForPatient(patientId: string) {
    return this.workspaceRepository.find({
      where: { patientId },
      order: { createdAt: 'DESC' },
      relations: ['logs', 'logs.author'],
    });
  }

  async getWorkspace(id: string) {
    const workspace = await this.workspaceRepository.findOne({
      where: { id },
      relations: ['logs', 'logs.author', 'logs.author.profile', 'patient', 'patient.profile'],
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with ID ${id} not found`);
    }

    return workspace;
  }

  async createLogEntry(workspaceId: string, createLogEntryDto: CreateLogEntryDto, authorId: string) {
    const workspace = await this.workspaceRepository.findOne({ where: { id: workspaceId } });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const user = await this.usersService.findById(authorId);
    if (!user) throw new NotFoundException('Author not found');

    const logEntry = this.logRepository.create({
      workspaceId,
      authorId,
      authorRole: (user as any).role || 'Staff', // Fallback if role is not set
      content: createLogEntryDto.content,
      isSystemGenerated: createLogEntryDto.isSystemGenerated || false,
    });

    const savedLog = await this.logRepository.save(logEntry);

    await this.auditService.logActivity(
      authorId,
      'clinical_log',
      'ADD_ENTRY',
      'Log entry added to workspace',
      { workspaceId, logId: savedLog.id }
    );

    return savedLog;
  }

  async getLogs(workspaceId: string) {
    return this.logRepository.find({
      where: { workspaceId },
      order: { timestamp: 'DESC' },
      relations: ['author', 'author.profile'],
    });
  }

  async addParticipant(workspaceId: string, participantId: string, authorId: string) {
    const workspace = await this.workspaceRepository.findOne({ 
      where: { id: workspaceId },
      relations: ['participants'] 
    });
    
    if (!workspace) throw new NotFoundException('Workspace not found');

    const newParticipant = await this.usersService.findById(participantId);
    if (!newParticipant) throw new NotFoundException('User to add not found');

    // 1. Add to Workspace Participants if not already there
    if (!workspace.participants.find(p => p.id === participantId)) {
      workspace.participants.push(newParticipant);
      await this.workspaceRepository.save(workspace);
    }

    // 2. Add to Chat Room
    if (workspace.chatRoomId) {
      await this.chatService.addParticipant(workspace.chatRoomId, participantId, authorId);
    }

    const participantName = (newParticipant as any).profile?.displayName || 
                           `${(newParticipant as any).profile?.firstName || ''} ${(newParticipant as any).profile?.lastName || ''}`.trim() || 
                           participantId;

    // 3. Log the action
    await this.createLogEntry(workspaceId, {
      content: `Added participant ${participantName} to the workspace.`,
      isSystemGenerated: true,
    }, authorId);

    await this.auditService.logActivity(
      authorId,
      'clinical_workspace',
      'ADD_PARTICIPANT',
      `Participant ${participantId} added to workspace ${workspaceId}`,
      { workspaceId, participantId }
    );

    return { success: true };
  }
}

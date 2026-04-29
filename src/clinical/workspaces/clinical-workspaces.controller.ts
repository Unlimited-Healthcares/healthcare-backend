import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ClinicalWorkspacesService } from './clinical-workspaces.service';
import { CreateWorkspaceDto, CreateLogEntryDto } from './dto/workspace.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('clinical-workspaces')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clinical/workspaces')
export class ClinicalWorkspacesController {
  constructor(private readonly workspacesService: ClinicalWorkspacesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new case/encounter workspace' })
  create(@Body() createWorkspaceDto: CreateWorkspaceDto, @Request() req) {
    return this.workspacesService.createWorkspace(createWorkspaceDto, req.user.userId);
  }

  @Get('patient/:patientId')
  @ApiOperation({ summary: 'Get all workspaces for a specific patient' })
  findByPatient(@Param('patientId') patientId: string) {
    return this.workspacesService.getWorkspacesForPatient(patientId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific workspace with its details' })
  findOne(@Param('id') id: string) {
    return this.workspacesService.getWorkspace(id);
  }

  @Post(':id/logs')
  @ApiOperation({ summary: 'Add a new entry to the collaborative log sheet' })
  addLog(@Param('id') id: string, @Body() createLogEntryDto: CreateLogEntryDto, @Request() req) {
    return this.workspacesService.createLogEntry(id, createLogEntryDto, req.user.userId);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get all log entries for a workspace' })
  getLogs(@Param('id') id: string) {
    return this.workspacesService.getLogs(id);
  }

  @Post(':id/participants')
  @ApiOperation({ summary: 'Add a participant to the workspace' })
  addParticipant(@Param('id') id: string, @Body('userId') userId: string, @Request() req) {
    return this.workspacesService.addParticipant(id, userId, req.user.userId);
  }
}

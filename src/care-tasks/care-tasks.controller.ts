import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { CareTasksService } from './care-tasks.service';
import { CreateCareTaskDto, UpdateCareTaskDto } from './dto/care-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Care Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('care-tasks')
export class CareTasksController {
  constructor(private readonly careTasksService: CareTasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new care task' })
  create(@Body() createCareTaskDto: CreateCareTaskDto, @Request() req) {
    return this.careTasksService.create(createCareTaskDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get care tasks with filters' })
  findAll(
    @Query('patientId') patientId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('status') status?: string,
  ) {
    return this.careTasksService.findAll({ patientId, assignedToId, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific care task' })
  findOne(@Param('id') id: string) {
    return this.careTasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a care task' })
  update(@Param('id') id: string, @Body() updateCareTaskDto: UpdateCareTaskDto) {
    return this.careTasksService.update(id, updateCareTaskDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a care task' })
  remove(@Param('id') id: string) {
    return this.careTasksService.remove(id);
  }
}

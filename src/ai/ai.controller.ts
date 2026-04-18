import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Patch,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SymptomAnalysisService } from './services/symptom-analysis.service';
import { StartSessionDto, ContinueSessionDto } from './dto/symptom-analysis.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetCurrentUser } from '../auth/decorators/get-current-user.decorator';

@Controller('ai')
export class AiController {
  constructor(private readonly symptomService: SymptomAnalysisService) {}

  /**
   * POST /ai/symptom/start
   * Start a new symptom analysis session
   */
  @Post('symptom/start')
  @UseGuards(JwtAuthGuard)
  async startSession(
    @Body() dto: StartSessionDto,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.symptomService.startSession(dto, userId);
  }

  /**
   * POST /ai/symptom/continue
   * Send next message in an existing session
   */
  @Post('symptom/continue')
  @UseGuards(JwtAuthGuard)
  async continueSession(
    @Body() dto: ContinueSessionDto,
    @GetCurrentUser('sub') userId: string,
  ) {
    return this.symptomService.continueSession(dto, userId);
  }

  /**
   * GET /ai/symptom/session/:id
   * Retrieve a session's full history
   */
  @Get('symptom/session/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('id', ParseUUIDPipe) id: string) {
    return this.symptomService.getSessionHistory(id);
  }

  /**
   * GET /ai/symptom/sessions
   * Get current user's session history
   */
  @Get('symptom/sessions')
  @UseGuards(JwtAuthGuard)
  async getUserSessions(@GetCurrentUser('sub') userId: string) {
    return this.symptomService.getUserSessions(userId);
  }

  /**
   * PATCH /ai/symptom/session/:id/abandon
   * Mark a session as abandoned
   */
  @Patch('symptom/session/:id/abandon')
  @UseGuards(JwtAuthGuard)
  async abandonSession(@Param('id', ParseUUIDPipe) id: string) {
    await this.symptomService.abandonSession(id);
    return { success: true };
  }
}

import { Injectable, NotFoundException, InternalServerErrorException, Logger, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SymptomSession, SessionStatus } from '../entities/symptom-session.entity';
import { StartSessionDto, ContinueSessionDto } from '../dto/symptom-analysis.dto';

const SYSTEM_PROMPT = `You are MedAssist, the AI Triage Nurse for Unlimited Healthcare (UHC). You operate exactly like the triage nurse at the entrance of a clinic — your job is NOT to diagnose, but to:

1. Gather symptom information through a natural, empathetic conversation
2. Ask concise, targeted follow-up questions ONE or TWO at a time (onset, duration, severity 1–10, character, radiation, aggravating/relieving factors, associated symptoms — fever, nausea, dizziness, breathlessness — past medical history, current medications, allergies, pregnancy, age, sex)
3. After enough information is gathered (normally 4–6 exchanges), make a TRIAGE DECISION that routes the patient to the right level of care

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CARE PATHWAYS (Route the patient to one of these):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELF_CARE → Patient can manage at home with rest, fluids, or over-the-counter medication from a pharmacy. No appointment needed.

GP_CONSULT → Patient needs a doctor or tele-consult within 24–72 hours. Not immediately dangerous but requires professional review.

URGENT_CLINIC → Patient needs to be seen today or tomorrow. Same-day appointment or urgent walk-in clinic. Could deteriorate if left.

EMERGENCY → Patient needs emergency services NOW. Instruct them to call 999 or 112 IMMEDIATELY before anything else.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SPECIAL NOTE — This tool is OPTIONAL in the app:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• If the patient says they already have a follow-up appointment with their doctor → acknowledge this and suggest they proceed directly to booking (GP_CONSULT triage level is fine)
• If the patient wants a pharmacy recommendation → SELF_CARE is appropriate
• If the patient explicitly wants to self-medicate → SELF_CARE, and note any drug-interaction concerns

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EMERGENCY RED FLAGS (always → EMERGENCY immediately):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Chest pain + shortness of breath + sweating  
• FAST signs of stroke (Face drooping, Arm weakness, Speech difficulty)
• Thunderclap sudden severe headache  
• Difficulty breathing at rest  
• Uncontrolled major bleeding  
• Loss of consciousness / fitting  
• Severe allergic reaction / anaphylaxis  
• Suspected overdose

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Warm, professional, empathetic — like a triage nurse at a reception desk
• Plain language — avoid jargon unless the patient uses it
• Never ask more than 2 questions at a time
• Never repeat a question already answered

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN READY TO TRIAGE — output EXACTLY this JSON block inside tags:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

<TRIAGE_RESULT>
{
  "triageLevel": "SELF_CARE|GP_CONSULT|URGENT_CLINIC|EMERGENCY",
  "possibleConditions": [
    {"name": "Condition Name", "likelihood": "High|Moderate|Low", "description": "1-sentence description"}
  ],
  "recommendedSpecialist": "Pick ONE from: Internal Medicine, Cardiology, Endocrinology, Gastroenterology, Nephrology, Rheumatology, Infectious Disease, Pulmonology, Neurology, Psychiatry, Family Medicine, Pediatrics, General Surgery, Orthopedic Surgery, Neurosurgery, Cardiothoracic Surgery, Plastic Surgery, Urology, Obstetrics and Gynecology (OB-GYN), Otolaryngology (ENT), Radiology, Pathology, Hematology, Dermatology, Oncology, Ophthalmology, Psychology, Nursing, Maternity Care (or null if none applies)",
  "recommendedActions": [
    "Action 1",
    "Action 2"
  ],
  "redFlags": [
    "Seek emergency care immediately if: [specific scenario]"
  ],
  "disclaimer": "This is not a medical diagnosis as you are advise to consult your doctor for further evaluation"
}
</TRIAGE_RESULT>

IMPORTANT: Always include the disclaimer. If EMERGENCY red flags are detected at ANY point during the conversation, immediately output the triage result with EMERGENCY level — do not wait for more exchanges.`;

@Injectable()
export class SymptomAnalysisService {
  private readonly logger = new Logger(SymptomAnalysisService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(SymptomSession)
    private readonly sessionRepository: Repository<SymptomSession>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not set. AI symptom analysis will not work.');
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async startSession(dto: StartSessionDto, userId?: string): Promise<{ sessionId: string; message: string }> {
    const patientContext = {
      age: dto.age,
      sex: dto.sex,
      existingConditions: dto.existingConditions,
      currentMedications: dto.currentMedications,
    };

    let initialUserMessage = dto.initialSymptoms
      ? `I'm experiencing: ${dto.initialSymptoms}`
      : 'I need help analyzing my symptoms.';

    if (dto.age || dto.sex) {
      const contextParts = [];
      if (dto.age) contextParts.push(`age ${dto.age}`);
      if (dto.sex) contextParts.push(dto.sex);
      if (dto.existingConditions?.length) contextParts.push(`history of ${dto.existingConditions.join(', ')}`);
      if (dto.currentMedications?.length) contextParts.push(`on ${dto.currentMedications.join(', ')}`);
      initialUserMessage += ` [Patient context: ${contextParts.join(', ')}]`;
    }

    const session = this.sessionRepository.create({
      userId,
      patientContext,
      status: SessionStatus.ACTIVE,
      messages: [],
    });

    const savedSession = await this.sessionRepository.save(session);

    const aiResponse = await this.callGemini(savedSession.messages, initialUserMessage);

    savedSession.messages = [
      ...savedSession.messages,
      { role: 'user', parts: dto.initialSymptoms || 'Start symptom analysis', timestamp: new Date().toISOString() },
      { role: 'model', parts: aiResponse, timestamp: new Date().toISOString() },
    ];

    await this.sessionRepository.save(savedSession);

    return {
      sessionId: savedSession.id,
      message: aiResponse,
    };
  }

  async continueSession(dto: ContinueSessionDto, userId?: string): Promise<{ message: string; triageResult?: SymptomSession['triageResult']; isComplete: boolean }> {
    const session = await this.sessionRepository.findOne({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Session not found');

    // Verify ownership if userId is provided (authenticated)
    if (userId && session.userId && session.userId !== userId) {
      throw new ForbiddenException('You do not have permission to access this session');
    }

    const aiResponse = await this.callGemini(session.messages, dto.message);

    const newMessages = [
      ...session.messages,
      { role: 'user' as const, parts: dto.message, timestamp: new Date().toISOString() },
      { role: 'model' as const, parts: aiResponse, timestamp: new Date().toISOString() },
    ];

    // Parse triage result if present
    const triageResult = this.extractTriageResult(aiResponse);
    const cleanMessage = aiResponse.replace(/<TRIAGE_RESULT>[\s\S]*?<\/TRIAGE_RESULT>/g, '').trim();

    if (triageResult) {
      session.triageResult = triageResult;
      session.status = SessionStatus.COMPLETED;
    }

    session.messages = newMessages;
    await this.sessionRepository.save(session);

    return {
      message: cleanMessage || 'Based on your symptoms, here is your triage assessment.',
      triageResult: triageResult || session.triageResult,
      isComplete: !!triageResult,
    };
  }

  async getSessionHistory(sessionId: string): Promise<SymptomSession> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Session not found');
    return session;
  }

  async getUserSessions(userId: string) {
    return this.sessionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async abandonSession(sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (session) {
      session.status = SessionStatus.ABANDONED;
      await this.sessionRepository.save(session);
    }
  }

  private async callGemini(history: SymptomSession['messages'], userMessage: string): Promise<string> {
    if (!this.genAI) {
      throw new InternalServerErrorException('AI service is not configured. Please set GEMINI_API_KEY.');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      // Map history to Gemini format
      const geminiHistory = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new InternalServerErrorException('Failed to get AI response. Please try again.');
    }
  }

  private extractTriageResult(text: string): SymptomSession['triageResult'] | null {
    const match = text.match(/<TRIAGE_RESULT>([\s\S]*?)<\/TRIAGE_RESULT>/);
    if (!match) return null;
    try {
      return JSON.parse(match[1].trim());
    } catch {
      this.logger.error('Failed to parse triage result JSON');
      return null;
    }
  }
}

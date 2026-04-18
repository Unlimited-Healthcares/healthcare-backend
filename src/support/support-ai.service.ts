import { Injectable, NotFoundException, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { SupportChatSession, SupportChatSessionStatus } from './entities/support-chat-session.entity';
import { StartSupportChatDto, ContinueSupportChatDto } from './dto/support-chat.dto';

const SUPPORT_SYSTEM_PROMPT = `You are the Unlimited Healthcare (UHC) Virtual Assistant. Your goal is to help users with their platform-related questions and provide general guidance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR CORE RESPONSIBILITIES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Help users navigate the platform (finding dashboards, booking appointments, viewing medical records)
2. Answer frequently asked questions about the service (insurance verification, payment methods, specialties)
3. If a user has a complex technical issue that requires manual intervention, suggest they "Submit a Ticket" and provide instructions on how to do so
4. Maintain a professional, polite, and helpful tone at all times

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KNOWLEDGE BASE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• We offer: Doctor consultations, Pharmacy services, Diagnostic tests, Ambulance services, Fitness/Nutrition coaching, Private Maternity care, and Lab services.
• Payments: We accept Paystack, Flutterwave, and Internal Wallet payments.
• Medical Records: Users can view their results and reports in the "Medical Reports" section of their dashboard.
• Triage: We have an "AI Symptom Analysis" tool that helps route patients to the right level of care.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESTRICTIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• DO NOT provide specific medical advice or diagnoses. 
• If a user is reporting a medical emergency, IMMEDIATELY tell them to call 911 or 999 or go to the nearest emergency room.
• Only answer questions related to healthcare and the UHC platform.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN TO SUBMIT A TICKET:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Account access issues
• Payment failures
• Data correction requests
• Official complaints

RESPONSE STYLE:
• Concise and clear.
• Use bullet points for steps.
• Always ask if there's anything else you can help with.`;

@Injectable()
export class SupportAiService {
  private readonly logger = new Logger(SupportAiService.name);
  private genAI: GoogleGenerativeAI;

  constructor(
    @InjectRepository(SupportChatSession)
    private readonly sessionRepository: Repository<SupportChatSession>,
    private readonly configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async startChat(dto: StartSupportChatDto, userId?: string): Promise<{ sessionId: string; message: string }> {
    const session = this.sessionRepository.create({
      userId,
      status: SupportChatSessionStatus.ACTIVE,
      messages: [],
    });

    const savedSession = await this.sessionRepository.save(session);
    const initialMessage = dto.initialTopic || 'Hello';
    
    const aiResponse = await this.callGemini([], initialMessage);

    savedSession.messages = [
      { role: 'user', parts: initialMessage, timestamp: new Date().toISOString() },
      { role: 'model', parts: aiResponse, timestamp: new Date().toISOString() },
    ];

    await this.sessionRepository.save(savedSession);

    return {
      sessionId: savedSession.id,
      message: aiResponse,
    };
  }

  async continueChat(dto: ContinueSupportChatDto, userId?: string): Promise<{ message: string; isComplete: boolean }> {
    const session = await this.sessionRepository.findOne({ where: { id: dto.sessionId } });
    if (!session) throw new NotFoundException('Chat session not found');

    const aiResponse = await this.callGemini(session.messages, dto.message);

    session.messages = [
      ...session.messages,
      { role: 'user' as const, parts: dto.message, timestamp: new Date().toISOString() },
      { role: 'model' as const, parts: aiResponse, timestamp: new Date().toISOString() },
    ];

    await this.sessionRepository.save(session);

    return {
      message: aiResponse,
      isComplete: false, // Support chats are usually ongoing or manually ended
    };
  }

  private async callGemini(history: any[], userMessage: string): Promise<string> {
    if (!this.genAI) {
      throw new InternalServerErrorException('AI service is not configured.');
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SUPPORT_SYSTEM_PROMPT,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const geminiHistory = history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.parts }],
      }));

      const chat = model.startChat({ history: geminiHistory });
      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    } catch (error) {
      this.logger.error('Gemini API error during support chat:', error);
      throw new InternalServerErrorException('Failed to get AI response.');
    }
  }
}

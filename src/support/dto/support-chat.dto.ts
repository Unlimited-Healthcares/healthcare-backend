import { IsString, IsOptional, IsUUID } from 'class-validator';

export class StartSupportChatDto {
  @IsString()
  @IsOptional()
  initialTopic?: string;
}

export class ContinueSupportChatDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  message: string;
}

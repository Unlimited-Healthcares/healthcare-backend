import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Logger } from '@nestjs/common';

interface RequestWithUser {
  ip: string;
  user?: {
    id: string;
    [key: string]: unknown;
  };
  route?: {
    path: string;
  };
  url: string;
  [key: string]: unknown;
}

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  private readonly logger = new Logger(RateLimitGuard.name);

  protected async getTracker(req: RequestWithUser): Promise<string> {
    // Use IP address as default tracker
    let tracker = req.ip;
    
    // If authenticated, use userId as tracker
    if (req.user && req.user.id) {
      tracker = req.user.id;
    }
    
    return tracker;
  }
} 
import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(private cacheService: CacheService) {}

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const blacklisted = await this.cacheService.get(`blacklist:${token}`);
      return !!blacklisted;
    } catch (error) {
      this.logger.warn(`Error checking token blacklist: ${error.message}`);
      return false;
    }
  }

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    try {
      // Store in cache with TTL equal to token expiration
      await this.cacheService.set(`blacklist:${token}`, 'true', expiresIn);
      this.logger.debug(`Token blacklisted successfully`);
    } catch (error) {
      this.logger.error(`Error blacklisting token: ${error.message}`);
    }
  }
} 
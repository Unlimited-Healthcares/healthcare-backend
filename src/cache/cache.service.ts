import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`, error.stack);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cached value for key: ${key}, TTL: ${ttl || 'default'}`);
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`, error.stack);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Deleted cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`, error.stack);
    }
  }

  async reset(): Promise<void> {
    try {
      // Use stores[0].clear() for cache-manager v6+
      const store = (this.cacheManager as { stores?: Array<{ clear?: () => Promise<void> }>; store?: { clear?: () => Promise<void> } }).stores?.[0] || (this.cacheManager as { store?: { clear?: () => Promise<void> } }).store;
      if (store && store.clear) {
        await store.clear();
      }
      this.logger.log('Cache reset successfully');
    } catch (error) {
      this.logger.error(`Cache reset error: ${error.message}`, error.stack);
    }
  }

  generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});

    return `${prefix}:${JSON.stringify(sortedParams)}`;
  }

  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    return await this.cacheManager.wrap(key, fn, ttl);
  }
} 
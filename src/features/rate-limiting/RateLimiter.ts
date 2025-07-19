import { logger } from '@/shared/Logger';
import { RateLimiterDataStore, RateLimitResult } from './RateLimiterDataStore';
import { Result } from '@/shared/Result';
import { RateLimitError, InternalServerError } from '@/shared/errors';

export interface RateLimiterOptions {
  limit: number;
  window: string;
  limitType: 'ip' | 'global';
}

export interface RateLimitData {
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

export class RateLimiter {
  private dataStore: RateLimiterDataStore;
  private limit: number;
  private window: string;
  private limitType: 'ip' | 'global';

  constructor(dataStore: RateLimiterDataStore, { limit, window, limitType }: RateLimiterOptions) {
    this.dataStore = dataStore;
    this.limit = limit;
    this.window = window;
    this.limitType = limitType;
  }

  static fromEnv(options: RateLimiterOptions): RateLimiter {
    const dataStore = RateLimiterDataStore.fromEnv();
    const rateLimiter = new RateLimiter(dataStore, options);
    return rateLimiter;
  }

  async checkLimit(identifier: string): Promise<Result<RateLimitData, RateLimitError | InternalServerError>> {
    const datastoreResult = await this.getRateLimitFromDatastore(identifier);

    if (!datastoreResult.success) {
      // Infrastructure failure - fail open with empty headers
      logger.error('Rate limiting error:', datastoreResult.error);
      const fallbackData: RateLimitData = {
        limit: 0,
        remaining: 0,
        reset: Date.now(),
        headers: {}
      };
      return Result.success(fallbackData);
    }

    const result = datastoreResult.data;

    const rateLimitData: RateLimitData = {
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.reset).toISOString()
      }
    };

    if (result.success) return Result.success(rateLimitData);

    const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
    const errorMessage = 'Too many requests. Please try again later.';
    const internalMessage = `Rate limit exceeded for ${identifier}: ${result.limit} requests per ${this.window}`;
    const rateLimitError = new RateLimitError(errorMessage, {
      internalMessage,
      retryAfter,
      limitType: this.limitType
    });

    return Result.failure(rateLimitError);
  }

  private async getRateLimitFromDatastore(identifier: string): Promise<Result<RateLimitResult, InternalServerError>> {
    try {
      const result = await this.dataStore.checkRateLimit(identifier, this.limit, this.window);
      return Result.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown rate limiter datastore error';
      const datastoreError = new InternalServerError(message, { internalMessage: message, metadata: { error } });
      return Result.failure(datastoreError);
    }
  }

  async clearKeys(pattern: string): Promise<void> {
    try {
      const keys = await this.dataStore.getKeys(pattern);
      if (keys.length > 0) {
        await this.dataStore.deleteKeys(...keys);
      }
    } catch (error) {
      logger.error('Rate limiter cleanup error:', error);
    }
  }
}

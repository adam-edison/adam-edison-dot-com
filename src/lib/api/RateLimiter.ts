import { logger } from '@/lib/logger/Logger';
import { RateLimiterDataStore } from '@/lib/data/RateLimiterDataStore';

export interface RateLimiterOptions {
  limit: number;
  window: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

export class RateLimiter {
  private dataStore: RateLimiterDataStore;
  private limit: number;
  private window: string;

  constructor(dataStore: RateLimiterDataStore, { limit, window }: RateLimiterOptions) {
    this.dataStore = dataStore;
    this.limit = limit;
    this.window = window;
  }

  static fromEnv(options: RateLimiterOptions): RateLimiter {
    const dataStore = RateLimiterDataStore.fromEnv();
    return new RateLimiter(dataStore, options);
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const result = await this.dataStore.checkRateLimit(identifier, this.limit, this.window);

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        headers: {
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.reset).toISOString()
        }
      };
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        success: true,
        limit: 0,
        remaining: 0,
        reset: Date.now(),
        headers: {}
      };
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

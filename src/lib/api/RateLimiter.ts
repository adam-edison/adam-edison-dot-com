import { Duration, Ratelimit } from '@upstash/ratelimit';
import type { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger/Logger';
import { DataStore } from '@/lib/data/DataStore';

export interface RateLimiterConfig {
  redis: Redis;
  limit: number;
  window: string;
  prefix?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  headers: Record<string, string>;
}

export class RateLimiter {
  private ratelimit: Ratelimit;
  private dataStore: DataStore;

  constructor(redis: Redis, limit: number, window: string, prefix?: string) {
    this.dataStore = { keys: redis.keys.bind(redis), del: redis.del.bind(redis) };

    const windowDuration = window as Duration;

    this.ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, windowDuration),
      analytics: true,
      prefix
    });
  }

  async checkLimit(identifier: string): Promise<RateLimitResult> {
    try {
      const result = await this.ratelimit.limit(identifier);

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
      const keys = await this.dataStore.keys(pattern);
      if (keys.length > 0) {
        await this.dataStore.del(...keys);
      }
    } catch (error) {
      logger.error('Redis cleanup error:', error);
    }
  }
}

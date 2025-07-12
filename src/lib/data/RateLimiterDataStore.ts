import { Redis } from '@upstash/redis';
import { Duration, Ratelimit } from '@upstash/ratelimit';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export class RateLimiterDataStore {
  private redis: Redis;
  private prefix: string;

  constructor(redis: Redis, prefix?: string) {
    this.redis = redis;
    this.prefix = prefix || process.env.REDIS_PREFIX || 'ratelimit';
  }

  static fromEnv(): RateLimiterDataStore {
    const redis = Redis.fromEnv();
    const prefix = process.env.REDIS_PREFIX;
    return new RateLimiterDataStore(redis, prefix);
  }

  // Basic Redis operations
  async getKeys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async deleteKeys(...keys: string[]): Promise<number> {
    return this.redis.del(...keys);
  }

  // Rate limiting operations - encapsulates Upstash Ratelimit
  async checkRateLimit(identifier: string, limit: number, window: string): Promise<RateLimitResult> {
    const windowDuration = window as Duration;

    const ratelimit = new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(limit, windowDuration),
      analytics: true,
      prefix: this.prefix
    });

    const result = await ratelimit.limit(identifier);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset
    };
  }
}

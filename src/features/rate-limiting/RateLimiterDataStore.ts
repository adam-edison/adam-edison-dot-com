import { Redis } from '@upstash/redis';
import { Duration, Ratelimit } from '@upstash/ratelimit';
import { isDurationString } from '@/shared/TypeGuards';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export class RateLimiterDataStore {
  private redis: Redis;
  private prefix: string;

  constructor(redis: Redis, prefix: string) {
    this.redis = redis;
    this.prefix = prefix;
  }

  static fromEnv(): RateLimiterDataStore {
    const redis = Redis.fromEnv();
    const prefix = process.env.REDIS_PREFIX!;
    const rateLimiterDataStore = new RateLimiterDataStore(redis, prefix);
    return rateLimiterDataStore;
  }

  async getKeys(pattern: string): Promise<string[]> {
    return this.redis.keys(pattern);
  }

  async deleteKeys(...keys: string[]): Promise<number> {
    return this.redis.del(...keys);
  }

  async checkRateLimit(identifier: string, limit: number, window: string): Promise<RateLimitResult> {
    if (!isDurationString(window)) {
      throw new Error(
        `Invalid window duration format: ${window}. Expected format: "number unit" (e.g., "10 m", "1 h")`
      );
    }
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

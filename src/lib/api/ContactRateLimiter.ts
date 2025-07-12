import { Redis } from '@upstash/redis';
import { RateLimiter, RateLimitResult } from './RateLimiter';

export interface ContactRateLimitResult {
  ipLimitExceeded: boolean;
  globalLimitExceeded: boolean;
  ipResult: RateLimitResult;
  globalResult: RateLimitResult;
}

export class ContactRateLimiter {
  private globalRateLimiter: RateLimiter;
  private ipRateLimiter: RateLimiter;

  constructor(globalRateLimiter: RateLimiter, ipRateLimiter: RateLimiter) {
    this.globalRateLimiter = globalRateLimiter;
    this.ipRateLimiter = ipRateLimiter;
  }

  static fromEnv(): ContactRateLimiter {
    const redis = Redis.fromEnv();
    const prefix = process.env.REDIS_PREFIX!;

    const globalRateLimiter = new RateLimiter({
      redis,
      limit: parseInt(process.env.GLOBAL_RATE_LIMIT_REQUESTS!),
      window: process.env.GLOBAL_RATE_LIMIT_WINDOW!,
      prefix
    });

    const ipRateLimiter = new RateLimiter({
      redis,
      limit: parseInt(process.env.RATE_LIMIT_REQUESTS!),
      window: process.env.RATE_LIMIT_WINDOW!,
      prefix
    });

    return new ContactRateLimiter(globalRateLimiter, ipRateLimiter);
  }

  async checkLimits(ip: string): Promise<ContactRateLimitResult> {
    const [globalResult, ipResult] = await Promise.all([
      this.globalRateLimiter.checkLimit('global'),
      this.ipRateLimiter.checkLimit(ip)
    ]);

    return {
      ipLimitExceeded: !ipResult.success,
      globalLimitExceeded: !globalResult.success,
      ipResult,
      globalResult
    };
  }

  async clearKeys(pattern: string): Promise<void> {
    await Promise.all([this.globalRateLimiter.clearKeys(pattern), this.ipRateLimiter.clearKeys(pattern)]);
  }
}

export const contactRateLimiter = ContactRateLimiter.fromEnv();

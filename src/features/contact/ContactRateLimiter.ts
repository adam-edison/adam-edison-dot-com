import { RateLimiter, RateLimitResult } from '@/features/rate-limiting/RateLimiter';

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
    const globalRateLimiter = RateLimiter.fromEnv({
      limit: parseInt(process.env.GLOBAL_RATE_LIMIT_REQUESTS!),
      window: process.env.GLOBAL_RATE_LIMIT_WINDOW!
    });

    const ipRateLimiter = RateLimiter.fromEnv({
      limit: parseInt(process.env.RATE_LIMIT_REQUESTS!),
      window: process.env.RATE_LIMIT_WINDOW!
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

import { RateLimiter, RateLimitResult } from '@/features/rate-limiting/RateLimiter';
import { Result } from '@/shared/Result';
import { RateLimitError } from '@/shared/errors';

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

  async checkLimits(ip: string): Promise<Result<{ headers: Record<string, string | number> }, RateLimitError>> {
    const [globalResult, ipResult] = await Promise.all([
      this.globalRateLimiter.checkLimit('global'),
      this.ipRateLimiter.checkLimit(ip)
    ]);

    // Combine headers for successful case
    const combinedHeaders = {
      ...globalResult.headers,
      ...ipResult.headers
    };

    // Check global limit first (more restrictive)
    if (!globalResult.success) {
      const retryAfter = Math.ceil((globalResult.reset - Date.now()) / 1000);
      const globalRateLimitError = new RateLimitError('Site-wide rate limit exceeded. Please try again later.', {
        internalMessage: `Global rate limit exceeded: ${globalResult.limit} requests per window`,
        retryAfter,
        limitType: 'global'
      });
      return Result.failure(globalRateLimitError);
    }

    // Check IP limit
    if (!ipResult.success) {
      const retryAfter = Math.ceil((ipResult.reset - Date.now()) / 1000);
      const ipRateLimitError = new RateLimitError('Too many requests. Please try again later.', {
        internalMessage: `IP rate limit exceeded: ${ipResult.limit} requests per window from ${ip}`,
        retryAfter,
        limitType: 'ip'
      });
      return Result.failure(ipRateLimitError);
    }

    return Result.success({ headers: combinedHeaders });
  }

  async clearKeys(pattern: string): Promise<void> {
    await Promise.all([this.globalRateLimiter.clearKeys(pattern), this.ipRateLimiter.clearKeys(pattern)]);
  }
}

import { RateLimiter, RateLimitResult } from '@/features/rate-limiting/RateLimiter';
import { Result } from '@/shared/Result';
import { RateLimitError, InternalServerError } from '@/shared/errors';

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

    const contactRateLimiter = new ContactRateLimiter(globalRateLimiter, ipRateLimiter);
    return contactRateLimiter;
  }

  async checkLimits(
    ip: string
  ): Promise<Result<{ headers: Record<string, string | number> }, RateLimitError | InternalServerError>> {
    const [globalResult, ipResult] = await Promise.all([
      this.globalRateLimiter.checkLimit('global'),
      this.ipRateLimiter.checkLimit(ip)
    ]);

    if (globalResult.success && ipResult.success) {
      const combinedHeaders = {
        ...globalResult.headers,
        ...ipResult.headers
      };

      return Result.success({ headers: combinedHeaders });
    }

    if (!globalResult.success) {
      const retryAfter = Math.ceil((globalResult.reset - Date.now()) / 1000);
      const clientMessage = 'Site-wide rate limit exceeded. Please try again later.';
      const internalMessage = `Global rate limit exceeded: ${globalResult.limit} requests per window`;

      const globalRateLimitError = new RateLimitError(clientMessage, {
        internalMessage,
        retryAfter,
        limitType: 'global'
      });

      return Result.failure(globalRateLimitError);
    }

    if (!ipResult.success) {
      // IP limit exceeded
      const retryAfter = Math.ceil((ipResult.reset - Date.now()) / 1000);
      const clientMessage = 'Too many requests. Please try again later.';
      const internalMessage = `IP rate limit exceeded: ${ipResult.limit} requests per window from ${ip}`;
      const ipRateLimitError = new RateLimitError(clientMessage, {
        internalMessage,
        retryAfter,
        limitType: 'ip'
      });

      return Result.failure(ipRateLimitError);
    }

    const internalMessage =
      'Rate limiter reached unexpected state: both globalResult and ipResult should have been checked';
    const clientMessage = 'Internal server error';
    const error = new InternalServerError(clientMessage, { internalMessage });
    return Result.failure(error);
  }

  async clearKeys(pattern: string): Promise<void> {
    await Promise.all([this.globalRateLimiter.clearKeys(pattern), this.ipRateLimiter.clearKeys(pattern)]);
  }
}

import { RateLimiter } from '@/features/rate-limiting/RateLimiter';
import { Result } from '@/shared/Result';
import { RateLimitError, InternalServerError } from '@/shared/errors';

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
      window: process.env.GLOBAL_RATE_LIMIT_WINDOW!,
      limitType: 'global'
    });

    const ipRateLimiter = RateLimiter.fromEnv({
      limit: parseInt(process.env.RATE_LIMIT_REQUESTS!),
      window: process.env.RATE_LIMIT_WINDOW!,
      limitType: 'ip'
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
        ...globalResult.data.headers,
        ...ipResult.data.headers
      };

      return Result.success({ headers: combinedHeaders });
    }

    if (!globalResult.success) return Result.failure(globalResult.error);
    if (!ipResult.success) return Result.failure(ipResult.error);

    const internalMessage = 'Rate limiter reached unexpected state';
    const clientMessage = 'Internal server error';
    const error = new InternalServerError(clientMessage, { internalMessage, metadata: { globalResult, ipResult } });
    return Result.failure(error);
  }

  async clearKeys(pattern: string): Promise<void> {
    await Promise.all([this.globalRateLimiter.clearKeys(pattern), this.ipRateLimiter.clearKeys(pattern)]);
  }
}

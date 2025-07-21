import { RateLimiter } from '@/features/rate-limiting/RateLimiter';
import { Result } from '@/shared/Result';
import { RateLimitError, InternalServerError } from '@/shared/errors';

export class ContactRateLimiter {
  private globalRateLimiter: RateLimiter;
  private ipRateLimiter: RateLimiter;
  private emailRateLimiter: RateLimiter;

  constructor(globalRateLimiter: RateLimiter, ipRateLimiter: RateLimiter, emailRateLimiter: RateLimiter) {
    this.globalRateLimiter = globalRateLimiter;
    this.ipRateLimiter = ipRateLimiter;
    this.emailRateLimiter = emailRateLimiter;
  }

  static fromEnv(): ContactRateLimiter {
    const globalRateLimiter = RateLimiter.fromEnv({
      limit: parseInt(process.env.CONTACT_GLOBAL_RATE_LIMIT_REQUESTS || '10'),
      window: process.env.CONTACT_GLOBAL_RATE_LIMIT_WINDOW || '1 h',
      limitType: 'global'
    });

    const ipRateLimiter = RateLimiter.fromEnv({
      limit: parseInt(process.env.CONTACT_IP_RATE_LIMIT_REQUESTS || '5'),
      window: process.env.CONTACT_IP_RATE_LIMIT_WINDOW || '10 m',
      limitType: 'ip'
    });

    // Email rate limiting with more restrictive limits (optional - fallback values provided)
    const emailRateLimiter = RateLimiter.fromEnv({
      limit: parseInt(process.env.CONTACT_EMAIL_RATE_LIMIT_REQUESTS || '3'), // Fallback: 3 submissions per hour per email
      window: process.env.CONTACT_EMAIL_RATE_LIMIT_WINDOW || '1 h',
      limitType: 'email'
    });

    const contactRateLimiter = new ContactRateLimiter(globalRateLimiter, ipRateLimiter, emailRateLimiter);
    return contactRateLimiter;
  }

  async checkLimits(
    ip: string,
    email?: string
  ): Promise<Result<{ headers: Record<string, string | number> }, RateLimitError | InternalServerError>> {
    // Always check global and IP limits
    const limitChecks = [this.globalRateLimiter.checkLimit('global'), this.ipRateLimiter.checkLimit(ip)];

    // If email is provided and valid, also check email rate limit
    if (email && this.isValidEmail(email)) {
      // Normalize email for consistent rate limiting (lowercase, remove dots from gmail)
      const normalizedEmail = this.normalizeEmail(email);
      limitChecks.push(this.emailRateLimiter.checkLimit(normalizedEmail));
    }

    const results = await Promise.all(limitChecks);
    const [globalResult, ipResult, emailResult] = results;

    // Check if all limits pass
    const allSuccess = results.every((result) => result.success);

    if (allSuccess) {
      let combinedHeaders: Record<string, string | number> = {};

      if (globalResult.success) {
        combinedHeaders = { ...combinedHeaders, ...globalResult.data.headers };
      }
      if (ipResult.success) {
        combinedHeaders = { ...combinedHeaders, ...ipResult.data.headers };
      }
      if (emailResult && emailResult.success) {
        combinedHeaders = { ...combinedHeaders, ...emailResult.data.headers };
      }

      return Result.success({ headers: combinedHeaders });
    }

    // Return the first failure (prioritize global > ip > email)
    if (!globalResult.success) return Result.failure(globalResult.error);
    if (!ipResult.success) return Result.failure(ipResult.error);
    if (emailResult && !emailResult.success) return Result.failure(emailResult.error);

    const internalMessage = 'Rate limiter reached unexpected state';
    const clientMessage = 'Internal server error';
    const error = new InternalServerError(clientMessage, {
      internalMessage,
      metadata: { globalResult, ipResult, emailResult }
    });
    return Result.failure(error);
  }

  async clearKeys(pattern: string): Promise<void> {
    await Promise.all([
      this.globalRateLimiter.clearKeys(pattern),
      this.ipRateLimiter.clearKeys(pattern),
      this.emailRateLimiter.clearKeys(pattern)
    ]);
  }

  /**
   * Basic email validation for rate limiting purposes
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254; // RFC 5321 limit
  }

  /**
   * Normalize email for consistent rate limiting
   * - Convert to lowercase
   * - Remove dots from Gmail addresses (gmail treats them as the same)
   * - Handle gmail alias (+suffix) normalization
   */
  private normalizeEmail(email: string): string {
    const lowercased = email.toLowerCase().trim();
    const [localPart, domain] = lowercased.split('@');

    if (domain === 'gmail.com') {
      // Remove dots and everything after + for Gmail
      const normalizedLocal = localPart.replace(/\./g, '').split('+')[0];
      return `${normalizedLocal}@${domain}`;
    }

    // For other domains, just return lowercase
    return lowercased;
  }
}

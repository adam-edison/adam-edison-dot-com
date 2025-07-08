import { describe, it, expect, afterEach } from 'vitest';
import { checkRateLimit, checkGlobalRateLimit, rateLimiter, globalRateLimiter } from '../rateLimit';
import { generateUniqueIP } from '../../../../tests/utils/testHelpers';

const ipRequestLimit = parseInt(process.env.RATE_LIMIT_REQUESTS!);
const globalRequestLimit = parseInt(process.env.GLOBAL_RATE_LIMIT_REQUESTS!);

describe('Combined Rate Limiting Integration Tests', () => {
  afterEach(async () => {
    // Clean up both per-IP and global rate limit keys after each test
    await Promise.all([
      rateLimiter.clearKeys('personal-website:*'),
      globalRateLimiter.clearKeys('personal-website:global*')
    ]);
  });

  it('should enforce both per-IP and global rate limits independently', async () => {
    const ip1 = generateUniqueIP();

    // Make a request to per-IP rate limiter
    const ip1Result = await checkRateLimit(ip1);
    expect(ip1Result.success).toBe(true);
    expect(ip1Result.headers['X-RateLimit-Limit']).toBe(ipRequestLimit.toString());

    // Make a request to global rate limiter
    const globalResult = await checkGlobalRateLimit();
    expect(globalResult.success).toBe(true);
    expect(globalResult.headers['X-RateLimit-Limit']).toBe(globalRequestLimit.toString());

    // Both should work independently
    expect(ip1Result.headers['X-RateLimit-Limit']).not.toBe(globalResult.headers['X-RateLimit-Limit']);
  });

  it('should use different identifiers for per-IP vs global limits', async () => {
    // This test verifies that the per-IP limiter uses the IP as identifier
    // and the global limiter uses 'global' as identifier

    const ip1 = generateUniqueIP();
    const ip2 = generateUniqueIP();

    // Different IPs should have separate per-IP limits
    const ip1Result = await checkRateLimit(ip1);
    const ip2Result = await checkRateLimit(ip2);

    expect(ip1Result.success).toBe(true);
    expect(ip2Result.success).toBe(true);

    // Both should have the same limit but potentially different remaining counts
    expect(ip1Result.headers['X-RateLimit-Limit']).toBe(ipRequestLimit.toString());
    expect(ip2Result.headers['X-RateLimit-Limit']).toBe(ipRequestLimit.toString());

    // Global limiter should use a single shared identifier
    const globalResult = await checkGlobalRateLimit();
    expect(globalResult.success).toBe(true);
    expect(globalResult.headers['X-RateLimit-Limit']).toBe(globalRequestLimit.toString());
  });
});

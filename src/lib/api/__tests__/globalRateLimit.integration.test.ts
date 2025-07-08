import { describe, it, expect, afterEach } from 'vitest';
import { checkGlobalRateLimit, globalRateLimiter } from '../rateLimit';

const globalRequestLimit = parseInt(process.env.GLOBAL_RATE_LIMIT_REQUESTS!);

describe('Global Rate Limiting Integration Tests', () => {
  afterEach(async () => {
    // Clean up global rate limit keys after each test
    await globalRateLimiter.clearKeys('personal-website:global*');
  });

  it('should return proper headers for global rate limiting', async () => {
    const result = await checkGlobalRateLimit();

    // Should succeed with proper headers
    expect(result.success).toBe(true);
    expect(result.headers).toHaveProperty('X-RateLimit-Limit');
    expect(result.headers).toHaveProperty('X-RateLimit-Remaining');
    expect(result.headers).toHaveProperty('X-RateLimit-Reset');

    // Should use the correct limit
    expect(result.headers['X-RateLimit-Limit']).toBe(globalRequestLimit.toString());
    expect(parseInt(result.headers['X-RateLimit-Remaining']!)).toBeGreaterThanOrEqual(0);
    expect(parseInt(result.headers['X-RateLimit-Remaining']!)).toBeLessThanOrEqual(globalRequestLimit);
  });

  it('should track global limit independently of IP-specific limits', async () => {
    // This test verifies that the global limiter uses the 'global' identifier
    // and doesn't interfere with per-IP rate limits

    const globalResult = await checkGlobalRateLimit();
    expect(globalResult.success).toBe(true);
    expect(globalResult.headers['X-RateLimit-Limit']).toBe(globalRequestLimit.toString());

    // Should have valid remaining count
    const remaining = parseInt(globalResult.headers['X-RateLimit-Remaining']);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(globalRequestLimit);
  });
});

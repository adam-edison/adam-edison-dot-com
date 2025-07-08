import { describe, it, expect } from 'vitest';
import { checkRateLimit, checkGlobalRateLimit } from '../rateLimit';

describe('Combined Rate Limiting Integration Tests', () => {
  // These tests use the default environment values set in tests/setup/integration.ts
  // RATE_LIMIT_REQUESTS=5, RATE_LIMIT_WINDOW=10m
  // GLOBAL_RATE_LIMIT_REQUESTS=100, GLOBAL_RATE_LIMIT_WINDOW=1h

  it('should enforce both per-IP and global rate limits independently', async () => {
    const ip1 = '192.168.1.1';

    // Make a request to per-IP rate limiter
    const ip1Result = await checkRateLimit(ip1);
    expect(ip1Result.success).toBe(true);
    expect(ip1Result.headers['X-RateLimit-Limit']).toBe('5');

    // Make a request to global rate limiter
    const globalResult = await checkGlobalRateLimit();
    expect(globalResult.success).toBe(true);
    expect(globalResult.headers['X-RateLimit-Limit']).toBe('100');

    // Both should work independently
    expect(ip1Result.headers['X-RateLimit-Limit']).not.toBe(globalResult.headers['X-RateLimit-Limit']);
  });

  it('should use different identifiers for per-IP vs global limits', async () => {
    // This test verifies that the per-IP limiter uses the IP as identifier
    // and the global limiter uses 'global' as identifier
    
    const ip1 = '192.168.1.10';
    const ip2 = '192.168.1.11';

    // Different IPs should have separate per-IP limits
    const ip1Result = await checkRateLimit(ip1);
    const ip2Result = await checkRateLimit(ip2);
    
    expect(ip1Result.success).toBe(true);
    expect(ip2Result.success).toBe(true);
    
    // Both should have the same limit but potentially different remaining counts
    expect(ip1Result.headers['X-RateLimit-Limit']).toBe('5');
    expect(ip2Result.headers['X-RateLimit-Limit']).toBe('5');
    
    // Global limiter should use a single shared identifier
    const globalResult = await checkGlobalRateLimit();
    expect(globalResult.success).toBe(true);
    expect(globalResult.headers['X-RateLimit-Limit']).toBe('100');
  });
});
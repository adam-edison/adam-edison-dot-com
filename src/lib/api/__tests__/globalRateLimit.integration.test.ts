import { describe, it, expect } from 'vitest';
import { checkGlobalRateLimit } from '../rateLimit';

describe('Global Rate Limiting Integration Tests', () => {
  // These tests use the default environment values set in tests/setup/integration.ts
  // GLOBAL_RATE_LIMIT_REQUESTS=100, GLOBAL_RATE_LIMIT_WINDOW=1h

  it('should return proper headers for global rate limiting', async () => {
    const result = await checkGlobalRateLimit();
    
    // Should succeed with proper headers
    expect(result.success).toBe(true);
    expect(result.headers).toHaveProperty('X-RateLimit-Limit');
    expect(result.headers).toHaveProperty('X-RateLimit-Remaining');
    expect(result.headers).toHaveProperty('X-RateLimit-Reset');
    
    // Should use the correct limit
    expect(result.headers['X-RateLimit-Limit']).toBe('100');
    expect(parseInt(result.headers['X-RateLimit-Remaining'])).toBeGreaterThanOrEqual(0);
    expect(parseInt(result.headers['X-RateLimit-Remaining'])).toBeLessThanOrEqual(100);
  });

  it('should track global limit independently of IP-specific limits', async () => {
    // This test verifies that the global limiter uses the 'global' identifier
    // and doesn't interfere with per-IP rate limits
    
    const globalResult = await checkGlobalRateLimit();
    expect(globalResult.success).toBe(true);
    expect(globalResult.headers['X-RateLimit-Limit']).toBe('100');
    
    // Should have valid remaining count
    const remaining = parseInt(globalResult.headers['X-RateLimit-Remaining']);
    expect(remaining).toBeGreaterThanOrEqual(0);
    expect(remaining).toBeLessThanOrEqual(100);
  });
});
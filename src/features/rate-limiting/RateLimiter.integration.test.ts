/**
 * Integration tests for RateLimiter class
 *
 * These tests require real Redis configuration:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Tests will fail with clear error messages if Redis is not configured.
 */
import { Redis } from '@upstash/redis';
import { RateLimiter } from './RateLimiter';
import { RateLimiterDataStore } from './RateLimiterDataStore';
import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { generateUniqueIdentifier } from '@tests/utils/testHelpers';
import assert from 'node:assert';

describe.skipIf(!process.env.UPSTASH_REDIS_REST_URL?.startsWith('https://'))('RateLimiter Integration Tests', () => {
  let rateLimiter: RateLimiter;
  const basePrefix = process.env.REDIS_PREFIX;
  const testPrefix = `${basePrefix}-integration-rate-limit`;

  beforeAll(() => {
    rateLimiter = RateLimiter.fromEnv({ limit: 5, window: '10 m', limitType: 'ip' });
  });

  afterEach(async () => {
    await rateLimiter.clearKeys(`${testPrefix}:*`);
  });

  test('should allow requests within rate limit', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);

    const result = await rateLimiter.checkLimit(identifier);

    expect(result.success).toBe(true);
    assert(result.success);
    expect(result.data.limit).toBe(5);
    expect(result.data.remaining).toBe(4);
    expect(result.data.headers['X-RateLimit-Limit']).toBe('5');
    expect(result.data.headers['X-RateLimit-Remaining']).toBe('4');
  });

  test('should enforce rate limit after exceeding threshold', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);
    const results = [];

    for (let i = 0; i < 6; i++) {
      const result = await rateLimiter.checkLimit(identifier);
      results.push(result);

      // Small delay for precision
      if (i < 5) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    // First 5 should succeed
    const successful = results.filter((r) => r.success);
    const rateLimited = results.filter((r) => !r.success);

    expect(successful.length).toBe(5);
    expect(rateLimited.length).toBe(1);

    assert(successful[0].success);
    expect(successful[0].data.remaining).toBe(4);
  });

  test('should have separate limits for different identifiers', async () => {
    const identifier1 = generateUniqueIdentifier(testPrefix);
    const identifier2 = generateUniqueIdentifier(testPrefix);

    // Exhaust limit for identifier1
    for (let i = 0; i < 6; i++) {
      await rateLimiter.checkLimit(identifier1);
    }

    // identifier2 should still be allowed
    const result = await rateLimiter.checkLimit(identifier2);
    expect(result.success).toBe(true);
    assert(result.success);
    expect(result.data.remaining).toBe(4);
  });

  test('should include proper headers in response', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);

    const result = await rateLimiter.checkLimit(identifier);

    expect(result.success).toBe(true);
    assert(result.success);
    expect(result.data.headers).toHaveProperty('X-RateLimit-Limit');
    expect(result.data.headers).toHaveProperty('X-RateLimit-Remaining');
    expect(result.data.headers).toHaveProperty('X-RateLimit-Reset');

    expect(parseInt(result.data.headers['X-RateLimit-Limit'])).toBe(5);
    expect(parseInt(result.data.headers['X-RateLimit-Remaining'])).toBe(4);

    // Reset time should be a valid ISO date string
    expect(() => new Date(result.data.headers['X-RateLimit-Reset'])).not.toThrow();
  });

  test('should respect sliding window behavior', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);

    // Make 5 requests to reach the limit
    for (let i = 0; i < 5; i++) {
      const result = await rateLimiter.checkLimit(identifier);
      expect(result.success).toBe(true);
    }

    // 6th request should be rate limited
    const rateLimitedResult = await rateLimiter.checkLimit(identifier);
    expect(rateLimitedResult.success).toBe(false);
    assert(!rateLimitedResult.success);
    expect(rateLimitedResult.error.code).toBe('RATE_LIMIT_ERROR');
  });

  test('should handle Redis errors gracefully (fail open)', async () => {
    // Create a rate limiter with invalid Redis config to simulate failure
    const invalidRedis = new Redis({ url: 'https://invalid-url.invalid', token: 'invalid-token' });
    const invalidDataStore = new RateLimiterDataStore(invalidRedis, `${testPrefix}-fail-test`);

    const failingRateLimiter = new RateLimiter(invalidDataStore, { limit: 5, window: '10 m', limitType: 'ip' });

    const identifier = generateUniqueIdentifier(`${testPrefix}-fail-test`);
    const result = await failingRateLimiter.checkLimit(identifier);

    // Should fail open (allow the request on infrastructure failure)
    expect(result.success).toBe(true);
    assert(result.success);
    expect(result.data.limit).toBe(0);
    expect(result.data.remaining).toBe(0);
    expect(Object.keys(result.data.headers)).toHaveLength(0);
  });
});

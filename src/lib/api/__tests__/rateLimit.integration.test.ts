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
import { RateLimiter } from '../RateLimiter';
import { RateLimiterDataStore } from '../../data/RateLimiterDataStore';
import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import { generateUniqueIdentifier } from '../../../../tests/utils/testHelpers';

describe('RateLimiter Integration Tests', () => {
  let rateLimiter: RateLimiter;
  const basePrefix = process.env.REDIS_PREFIX;
  const testPrefix = `${basePrefix}-integration-rate-limit`;

  beforeAll(() => {
    rateLimiter = RateLimiter.fromEnv({ limit: 5, window: '10 m' });
  });

  afterEach(async () => {
    // Clean up test keys after each test
    await rateLimiter.clearKeys(`${testPrefix}:*`);
  });

  test('should allow requests within rate limit', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);

    const result = await rateLimiter.checkLimit(identifier);

    expect(result.success).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.remaining).toBe(4);
    expect(result.headers['X-RateLimit-Limit']).toBe('5');
    expect(result.headers['X-RateLimit-Remaining']).toBe('4');
  });

  test('should enforce rate limit after exceeding threshold', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);
    const results = [];

    // Make 6 requests sequentially
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

    // Check that the first request shows correct remaining count
    expect(successful[0].remaining).toBe(4);
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
    expect(result.remaining).toBe(4);
  });

  test('should include proper headers in response', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);

    const result = await rateLimiter.checkLimit(identifier);

    expect(result.headers).toHaveProperty('X-RateLimit-Limit');
    expect(result.headers).toHaveProperty('X-RateLimit-Remaining');
    expect(result.headers).toHaveProperty('X-RateLimit-Reset');

    expect(parseInt(result.headers['X-RateLimit-Limit'])).toBe(5);
    expect(parseInt(result.headers['X-RateLimit-Remaining'])).toBe(4);

    // Reset time should be a valid ISO date string
    expect(() => new Date(result.headers['X-RateLimit-Reset'])).not.toThrow();
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
    expect(rateLimitedResult.limit).toBe(5);
    expect(rateLimitedResult.remaining).toBe(0);
  });

  test('should handle Redis errors gracefully (fail open)', async () => {
    // Create a rate limiter with invalid Redis config to simulate failure
    const invalidRedis = new Redis({ url: 'https://invalid-url.invalid', token: 'invalid-token' });
    const invalidDataStore = new RateLimiterDataStore(invalidRedis, `${testPrefix}-fail-test`);

    const failingRateLimiter = new RateLimiter(invalidDataStore, { limit: 5, window: '10 m' });

    const identifier = generateUniqueIdentifier(`${testPrefix}-fail-test`);
    const result = await failingRateLimiter.checkLimit(identifier);

    // Should fail open (allow the request)
    expect(result.success).toBe(true);
    expect(result.limit).toBe(0);
    expect(result.remaining).toBe(0);
    expect(Object.keys(result.headers)).toHaveLength(0);
  });
});

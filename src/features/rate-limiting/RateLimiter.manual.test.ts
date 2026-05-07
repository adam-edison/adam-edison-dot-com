import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import assert, { fail } from 'node:assert';
import { RateLimiter } from './RateLimiter';
import { generateUniqueIdentifier } from '@tests/utils/testHelpers';

/* Run this test with:
  npm run test:manual -- --testNamePattern "Upstash Rate Limiter"
*/

describe('Upstash Rate Limiter (Manual)', () => {
  let rateLimiter: RateLimiter;
  let basePrefix: string;
  let testPrefix: string;

  beforeEach(() => {
    const requiredEnvVars = ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN', 'REDIS_PREFIX'];
    const missingVars = requiredEnvVars.filter((name) => !process.env[name]);

    if (missingVars.length > 0) {
      fail(`Skipping manual rate limiter test - missing environment variables: ${missingVars.join(', ')}`);
    }

    basePrefix = process.env.REDIS_PREFIX!;
    testPrefix = `${basePrefix}-manual-rate-limit`;
    rateLimiter = RateLimiter.fromEnv({ limit: 5, window: '10 m', limitType: 'ip' });
  });

  afterEach(async () => {
    await rateLimiter.clearKeys(`${basePrefix}:*${testPrefix}*`);
  });

  test('should hit the real Upstash rate limiter and return a successful decision', async () => {
    const identifier = generateUniqueIdentifier(testPrefix);

    const result = await rateLimiter.checkLimit(identifier);

    assert(result.success, 'Expected rate limit check to succeed against real Upstash');
    expect(result.data).toMatchObject({
      limit: 5,
      remaining: 4,
      headers: {
        'X-RateLimit-Limit': '5',
        'X-RateLimit-Remaining': '4'
      }
    });
    expect(Number.isNaN(new Date(result.data.headers['X-RateLimit-Reset']).getTime())).toBe(false);
  });
});

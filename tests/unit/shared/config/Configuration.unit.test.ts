import { describe, it, expect, beforeEach } from 'vitest';
import { Configuration } from '@/shared/config/Configuration';

describe('Configuration', () => {
  beforeEach(() => {
    Configuration.reset();
  });

  describe('forTesting', () => {
    it('returns a fully populated environment from defaults alone', () => {
      const env = Configuration.forTesting();

      expect(env).toMatchObject({
        NODE_ENV: 'test',
        RESEND_API_KEY: 'test-resend-key',
        FROM_EMAIL: 'from@example.test',
        TO_EMAIL: 'to@example.test',
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient',
        SEND_EMAIL_ENABLED: false,
        TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
        UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
        UPSTASH_REDIS_REST_TOKEN: 'test-token',
        REDIS_PREFIX: 'test',
        RATE_LIMIT_REQUESTS: 5,
        RATE_LIMIT_WINDOW: '10 m',
        GLOBAL_RATE_LIMIT_REQUESTS: 10,
        GLOBAL_RATE_LIMIT_WINDOW: '1 h',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site',
        NEXT_PUBLIC_GITHUB_URL: 'https://github.com/test',
        NEXT_PUBLIC_LINKEDIN_URL: 'https://www.linkedin.com/in/test',
        NEXT_PUBLIC_REPO_URL: 'https://github.com/test/test'
      });
    });

    it('applies overrides on top of the defaults', () => {
      const env = Configuration.forTesting({
        SEND_EMAIL_ENABLED: 'true',
        REDIS_PREFIX: 'override',
        RATE_LIMIT_REQUESTS: '99'
      });

      expect(env).toMatchObject({
        SEND_EMAIL_ENABLED: true,
        REDIS_PREFIX: 'override',
        RATE_LIMIT_REQUESTS: 99
      });
    });

    it('throws when an override fails the schema', () => {
      expect(() => Configuration.forTesting({ FROM_EMAIL: 'not-an-email' })).toThrow(/FROM_EMAIL/);
    });

    it('aggregates every invalid override into one error message', () => {
      const matcher = /Environment validation failed[\s\S]*FROM_EMAIL[\s\S]*RATE_LIMIT_REQUESTS/;

      expect(() => Configuration.forTesting({ FROM_EMAIL: 'bad', RATE_LIMIT_REQUESTS: 'abc' })).toThrow(matcher);
    });
  });

  describe('get', () => {
    it('returns the environment cached by forTesting', () => {
      Configuration.forTesting({ REDIS_PREFIX: 'cached' });

      expect(Configuration.get().REDIS_PREFIX).toBe('cached');
    });
  });

  describe('reset', () => {
    it('clears the cache so a subsequent forTesting can replace the env', () => {
      Configuration.forTesting({ REDIS_PREFIX: 'first' });
      Configuration.reset();
      Configuration.forTesting({ REDIS_PREFIX: 'second' });

      expect(Configuration.get().REDIS_PREFIX).toBe('second');
    });
  });
});

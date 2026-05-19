import { describe, it, expect, beforeEach } from 'vitest';
import { ClientConfiguration } from '@/shared/config/clientConfig';

describe('ClientConfiguration', () => {
  beforeEach(() => {
    ClientConfiguration.reset();
  });

  describe('forTesting', () => {
    it('returns the full NEXT_PUBLIC_* surface from defaults alone', () => {
      const env = ClientConfiguration.forTesting();

      expect(env).toEqual({
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site',
        NEXT_PUBLIC_GITHUB_URL: 'https://github.com/test',
        NEXT_PUBLIC_LINKEDIN_URL: 'https://www.linkedin.com/in/test',
        NEXT_PUBLIC_REPO_URL: 'https://github.com/test/test',
        NEXT_PUBLIC_SENTRY_DSN: 'https://abc@o0.ingest.sentry.io/0',
        NEXT_PUBLIC_SENTRY_DISABLED: false
      });
    });

    it('applies overrides on top of the defaults', () => {
      const env = ClientConfiguration.forTesting({
        NEXT_PUBLIC_GITHUB_URL: 'https://github.com/override'
      });

      expect(env).toMatchObject({
        NEXT_PUBLIC_GITHUB_URL: 'https://github.com/override',
        NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site'
      });
    });

    it('throws when an override fails the schema', () => {
      expect(() => ClientConfiguration.forTesting({ NEXT_PUBLIC_GITHUB_URL: 'not-a-url' })).toThrow(
        /NEXT_PUBLIC_GITHUB_URL/
      );
    });

    it('aggregates every invalid override into one error message', () => {
      const matcher = /Client environment validation failed[\s\S]*NEXT_PUBLIC_GITHUB_URL[\s\S]*NEXT_PUBLIC_REPO_URL/;

      expect(() =>
        ClientConfiguration.forTesting({
          NEXT_PUBLIC_GITHUB_URL: 'bad',
          NEXT_PUBLIC_REPO_URL: 'also-bad'
        })
      ).toThrow(matcher);
    });
  });

  describe('get', () => {
    it('returns the environment cached by forTesting', () => {
      ClientConfiguration.forTesting({ NEXT_PUBLIC_GITHUB_URL: 'https://github.com/cached' });

      expect(ClientConfiguration.get().NEXT_PUBLIC_GITHUB_URL).toBe('https://github.com/cached');
    });
  });

  describe('reset', () => {
    it('clears the cache so a subsequent forTesting can replace the env', () => {
      ClientConfiguration.forTesting({ NEXT_PUBLIC_GITHUB_URL: 'https://github.com/first' });
      ClientConfiguration.reset();
      ClientConfiguration.forTesting({ NEXT_PUBLIC_GITHUB_URL: 'https://github.com/second' });

      expect(ClientConfiguration.get().NEXT_PUBLIC_GITHUB_URL).toBe('https://github.com/second');
    });
  });
});

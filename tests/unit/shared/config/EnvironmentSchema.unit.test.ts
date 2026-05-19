import { describe, it, expect } from 'vitest';
import { strict as assert } from 'node:assert';
import {
  ClientEnvironmentSchema,
  EnvironmentSchema,
  ServerOnlyEnvironmentSchema
} from '@/shared/config/EnvironmentSchema';

const sentryDsn = 'https://abc@o123.ingest.sentry.io/456';

const validRawEnv = {
  NODE_ENV: 'test',
  RESEND_API_KEY: 'rk_test',
  FROM_EMAIL: 'from@example.com',
  TO_EMAIL: 'to@example.com',
  EMAIL_SENDER_NAME: 'Sender',
  EMAIL_RECIPIENT_NAME: 'Recipient',
  SEND_EMAIL_ENABLED: 'true',
  TURNSTILE_SECRET_KEY: 'ts_secret',
  UPSTASH_REDIS_REST_URL: 'https://redis.example.com',
  UPSTASH_REDIS_REST_TOKEN: 'token',
  REDIS_PREFIX: 'app',
  RATE_LIMIT_REQUESTS: '5',
  RATE_LIMIT_WINDOW: '10 m',
  GLOBAL_RATE_LIMIT_REQUESTS: '20',
  GLOBAL_RATE_LIMIT_WINDOW: '1 h',
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'ts_site',
  NEXT_PUBLIC_GITHUB_URL: 'https://github.com/example',
  NEXT_PUBLIC_LINKEDIN_URL: 'https://linkedin.com/in/example',
  NEXT_PUBLIC_REPO_URL: 'https://github.com/example/repo',
  SENTRY_DSN: sentryDsn,
  SENTRY_AUTH_TOKEN: 'sntrys_token',
  SENTRY_ORG: 'acme',
  SENTRY_PROJECT: 'adamedison-com',
  NEXT_PUBLIC_SENTRY_DSN: sentryDsn
};

const failedPaths = (schema: typeof EnvironmentSchema, input: unknown): string[] => {
  const result = schema.safeParse(input);
  assert(!result.success, 'Expected validation to fail');
  return result.error.issues.map((issue) => String(issue.path[0])).sort();
};

describe('EnvironmentSchema', () => {
  it('parses a fully valid environment with type coercion', () => {
    const parsed = EnvironmentSchema.parse(validRawEnv);

    expect(parsed).toEqual({
      NODE_ENV: 'test',
      RESEND_API_KEY: 'rk_test',
      FROM_EMAIL: 'from@example.com',
      TO_EMAIL: 'to@example.com',
      EMAIL_SENDER_NAME: 'Sender',
      EMAIL_RECIPIENT_NAME: 'Recipient',
      SEND_EMAIL_ENABLED: true,
      TURNSTILE_SECRET_KEY: 'ts_secret',
      UPSTASH_REDIS_REST_URL: 'https://redis.example.com',
      UPSTASH_REDIS_REST_TOKEN: 'token',
      REDIS_PREFIX: 'app',
      RATE_LIMIT_REQUESTS: 5,
      RATE_LIMIT_WINDOW: '10 m',
      GLOBAL_RATE_LIMIT_REQUESTS: 20,
      GLOBAL_RATE_LIMIT_WINDOW: '1 h',
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'ts_site',
      NEXT_PUBLIC_GITHUB_URL: 'https://github.com/example',
      NEXT_PUBLIC_LINKEDIN_URL: 'https://linkedin.com/in/example',
      NEXT_PUBLIC_REPO_URL: 'https://github.com/example/repo',
      SENTRY_DSN: sentryDsn,
      SENTRY_AUTH_TOKEN: 'sntrys_token',
      SENTRY_ORG: 'acme',
      SENTRY_PROJECT: 'adamedison-com',
      NEXT_PUBLIC_SENTRY_DSN: sentryDsn,
      NEXT_PUBLIC_SENTRY_DISABLED: false
    });
  });

  it('aggregates every missing required field into one error', () => {
    const paths = failedPaths(EnvironmentSchema, {});

    expect(paths).toEqual([
      'EMAIL_RECIPIENT_NAME',
      'EMAIL_SENDER_NAME',
      'FROM_EMAIL',
      'GLOBAL_RATE_LIMIT_REQUESTS',
      'GLOBAL_RATE_LIMIT_WINDOW',
      'NEXT_PUBLIC_GITHUB_URL',
      'NEXT_PUBLIC_LINKEDIN_URL',
      'NEXT_PUBLIC_REPO_URL',
      'NEXT_PUBLIC_SENTRY_DSN',
      'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
      'RATE_LIMIT_REQUESTS',
      'RATE_LIMIT_WINDOW',
      'REDIS_PREFIX',
      'RESEND_API_KEY',
      'SENTRY_AUTH_TOKEN',
      'SENTRY_DSN',
      'SENTRY_ORG',
      'SENTRY_PROJECT',
      'TO_EMAIL',
      'TURNSTILE_SECRET_KEY',
      'UPSTASH_REDIS_REST_TOKEN',
      'UPSTASH_REDIS_REST_URL'
    ]);
  });

  it('treats SEND_EMAIL_ENABLED as optional defaulting to false', () => {
    const input = { ...validRawEnv };
    delete (input as Record<string, unknown>).SEND_EMAIL_ENABLED;

    const parsed = EnvironmentSchema.parse(input);

    expect(parsed.SEND_EMAIL_ENABLED).toBe(false);
  });

  it('coerces SEND_EMAIL_ENABLED only when value equals literal "true"', () => {
    const variants = ['true', 'false', 'yes', 'TRUE', '1'];

    const results = variants.map((value) => ({
      value,
      enabled: EnvironmentSchema.parse({ ...validRawEnv, SEND_EMAIL_ENABLED: value }).SEND_EMAIL_ENABLED
    }));

    expect(results).toEqual([
      { value: 'true', enabled: true },
      { value: 'false', enabled: false },
      { value: 'yes', enabled: false },
      { value: 'TRUE', enabled: false },
      { value: '1', enabled: false }
    ]);
  });

  it('rejects malformed URLs', () => {
    const paths = failedPaths(EnvironmentSchema, { ...validRawEnv, UPSTASH_REDIS_REST_URL: 'not-a-url' });

    expect(paths).toEqual(['UPSTASH_REDIS_REST_URL']);
  });

  it('rejects malformed emails', () => {
    const paths = failedPaths(EnvironmentSchema, { ...validRawEnv, FROM_EMAIL: 'not-an-email' });

    expect(paths).toEqual(['FROM_EMAIL']);
  });

  it('rejects non-numeric rate limit requests', () => {
    const paths = failedPaths(EnvironmentSchema, { ...validRawEnv, RATE_LIMIT_REQUESTS: 'abc' });

    expect(paths).toEqual(['RATE_LIMIT_REQUESTS']);
  });

  it('enforces upper bound on rate limit requests', () => {
    const paths = failedPaths(EnvironmentSchema, { ...validRawEnv, RATE_LIMIT_REQUESTS: '999999' });

    expect(paths).toEqual(['RATE_LIMIT_REQUESTS']);
  });

  it('accepts ms-compatible window strings', () => {
    const variants = ['500 ms', '30 s', '10 m', '1 h', '1 d', '5m'];

    const results = variants.map((window) => ({
      window,
      success: EnvironmentSchema.safeParse({ ...validRawEnv, RATE_LIMIT_WINDOW: window }).success
    }));

    expect(results).toEqual([
      { window: '500 ms', success: true },
      { window: '30 s', success: true },
      { window: '10 m', success: true },
      { window: '1 h', success: true },
      { window: '1 d', success: true },
      { window: '5m', success: true }
    ]);
  });

  it('rejects malformed window strings', () => {
    const paths = failedPaths(EnvironmentSchema, { ...validRawEnv, RATE_LIMIT_WINDOW: 'fortnight' });

    expect(paths).toEqual(['RATE_LIMIT_WINDOW']);
  });

  it('rejects zero-count window strings that would disable the limiter', () => {
    const zeroVariants = ['0 s', '0 m', '0 h', '00 ms'];

    const results = zeroVariants.map((window) => ({
      window,
      success: EnvironmentSchema.safeParse({ ...validRawEnv, RATE_LIMIT_WINDOW: window }).success
    }));

    expect(results).toEqual([
      { window: '0 s', success: false },
      { window: '0 m', success: false },
      { window: '0 h', success: false },
      { window: '00 ms', success: false }
    ]);
  });

  it('defaults NODE_ENV to development when unset', () => {
    const input = { ...validRawEnv };
    delete (input as Record<string, unknown>).NODE_ENV;

    const parsed = EnvironmentSchema.parse(input);

    expect(parsed.NODE_ENV).toBe('development');
  });

  it('rejects unknown NODE_ENV values', () => {
    const paths = failedPaths(EnvironmentSchema, { ...validRawEnv, NODE_ENV: 'staging' });

    expect(paths).toEqual(['NODE_ENV']);
  });

  it('rejects malformed Sentry DSN values', () => {
    const serverPaths = failedPaths(EnvironmentSchema, { ...validRawEnv, SENTRY_DSN: 'not-a-url' });
    const clientPaths = failedPaths(EnvironmentSchema, { ...validRawEnv, NEXT_PUBLIC_SENTRY_DSN: 'not-a-url' });

    expect({ serverPaths, clientPaths }).toEqual({
      serverPaths: ['SENTRY_DSN'],
      clientPaths: ['NEXT_PUBLIC_SENTRY_DSN']
    });
  });
});

describe('ClientEnvironmentSchema', () => {
  it('parses only the NEXT_PUBLIC_* subset', () => {
    const clientEnv = {
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'ts_site',
      NEXT_PUBLIC_GITHUB_URL: 'https://github.com/example',
      NEXT_PUBLIC_LINKEDIN_URL: 'https://linkedin.com/in/example',
      NEXT_PUBLIC_REPO_URL: 'https://github.com/example/repo',
      NEXT_PUBLIC_SENTRY_DSN: 'https://abc@o123.ingest.sentry.io/456'
    };

    const parsed = ClientEnvironmentSchema.parse(clientEnv);

    expect(parsed).toEqual({ ...clientEnv, NEXT_PUBLIC_SENTRY_DISABLED: false });
  });
});

describe('ServerOnlyEnvironmentSchema', () => {
  it('does not require NEXT_PUBLIC_* fields', () => {
    const input = { ...validRawEnv };
    delete (input as Record<string, unknown>).NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    delete (input as Record<string, unknown>).NEXT_PUBLIC_GITHUB_URL;
    delete (input as Record<string, unknown>).NEXT_PUBLIC_LINKEDIN_URL;
    delete (input as Record<string, unknown>).NEXT_PUBLIC_REPO_URL;

    const result = ServerOnlyEnvironmentSchema.safeParse(input);

    expect(result.success).toBe(true);
  });
});

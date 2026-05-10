import { describe, it, expect } from 'vitest';
import { EnvironmentSchema } from '@/shared/config/EnvironmentSchema';
import { checkProductionRequirements } from '@/shared/config/productionEnvCheck';

const baseRawEnv = {
  NODE_ENV: 'production',
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
  NEXT_PUBLIC_REPO_URL: 'https://github.com/example/repo'
};

const validSentryEnv = {
  SENTRY_DSN: 'https://abc@o123.ingest.sentry.io/456',
  NEXT_PUBLIC_SENTRY_DSN: 'https://abc@o123.ingest.sentry.io/456'
};

describe('checkProductionRequirements', () => {
  it('returns no issues outside production', () => {
    const env = EnvironmentSchema.parse({ ...baseRawEnv, NODE_ENV: 'development' });

    expect(checkProductionRequirements(env)).toEqual([]);
  });

  it('returns no issues when production has every required Sentry var', () => {
    const env = EnvironmentSchema.parse({ ...baseRawEnv, ...validSentryEnv });

    expect(checkProductionRequirements(env)).toEqual([]);
  });

  it('flags SENTRY_DSN when missing in production', () => {
    const env = EnvironmentSchema.parse({
      ...baseRawEnv,
      NEXT_PUBLIC_SENTRY_DSN: validSentryEnv.NEXT_PUBLIC_SENTRY_DSN
    });

    expect(checkProductionRequirements(env)).toEqual([
      'SENTRY_DSN: required in production for server-side error reporting'
    ]);
  });

  it('flags NEXT_PUBLIC_SENTRY_DSN when missing in production', () => {
    const env = EnvironmentSchema.parse({ ...baseRawEnv, SENTRY_DSN: validSentryEnv.SENTRY_DSN });

    expect(checkProductionRequirements(env)).toEqual([
      'NEXT_PUBLIC_SENTRY_DSN: required in production for client-side error reporting'
    ]);
  });

  it('aggregates every missing Sentry var in production', () => {
    const env = EnvironmentSchema.parse(baseRawEnv);

    expect(checkProductionRequirements(env)).toEqual([
      'SENTRY_DSN: required in production for server-side error reporting',
      'NEXT_PUBLIC_SENTRY_DSN: required in production for client-side error reporting'
    ]);
  });
});

import { Environment, EnvironmentSchema, formatZodIssues } from './EnvironmentSchema';
import { CLIENT_TEST_DEFAULTS } from './clientConfig';

type EnvironmentRawInput = Partial<Record<keyof Environment, string | undefined>>;

const TEST_DEFAULTS: Record<keyof Environment, string> = {
  NODE_ENV: 'test',
  RESEND_API_KEY: 'test-resend-key',
  FROM_EMAIL: 'from@example.test',
  TO_EMAIL: 'to@example.test',
  EMAIL_SENDER_NAME: 'Test Sender',
  EMAIL_RECIPIENT_NAME: 'Test Recipient',
  SEND_EMAIL_ENABLED: 'false',
  TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
  UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
  REDIS_PREFIX: 'test',
  RATE_LIMIT_REQUESTS: '5',
  RATE_LIMIT_WINDOW: '10 m',
  GLOBAL_RATE_LIMIT_REQUESTS: '10',
  GLOBAL_RATE_LIMIT_WINDOW: '1 h',
  SENTRY_DSN: 'https://abc@o0.ingest.sentry.io/0',
  SENTRY_AUTH_TOKEN: 'test-sentry-auth-token',
  SENTRY_ORG: 'test-org',
  SENTRY_PROJECT: 'test-project',
  ...CLIENT_TEST_DEFAULTS
};

export class Configuration {
  private static cached: Environment | null = null;

  static get(): Environment {
    if (Configuration.cached) return Configuration.cached;
    Configuration.cached = parseEnvironment(process.env);
    return Configuration.cached;
  }

  static forTesting(overrides: EnvironmentRawInput = {}): Environment {
    Configuration.cached = parseEnvironment({ ...TEST_DEFAULTS, ...overrides });
    return Configuration.cached;
  }

  static reset(): void {
    Configuration.cached = null;
  }
}

function parseEnvironment(rawEnv: Record<string, string | undefined>): Environment {
  const result = EnvironmentSchema.safeParse(rawEnv);
  if (result.success) return result.data;
  throw formatZodIssues('Environment validation failed', result.error.issues);
}

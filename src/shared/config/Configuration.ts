import { z } from 'zod';
import { Environment, EnvironmentSchema } from './EnvironmentSchema';

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
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site',
  NEXT_PUBLIC_GITHUB_URL: 'https://github.com/test',
  NEXT_PUBLIC_LINKEDIN_URL: 'https://www.linkedin.com/in/test',
  NEXT_PUBLIC_REPO_URL: 'https://github.com/test/test'
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

function parseEnvironment(env: Record<string, string | undefined>): Environment {
  const result = EnvironmentSchema.safeParse(env);
  if (result.success) return result.data;
  throw buildEnvironmentError(result.error.issues);
}

function buildEnvironmentError(issues: z.ZodIssue[]): Error {
  const problems = issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  return new Error(`Environment validation failed:\n  ${problems.join('\n  ')}`);
}

import { ClientEnvironment, ClientEnvironmentSchema, formatZodIssues } from './EnvironmentSchema';

type ClientEnvironmentRawInput = Partial<Record<keyof ClientEnvironment, string | undefined>>;

export const CLIENT_TEST_DEFAULTS: Record<keyof ClientEnvironment, string> = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 'test-turnstile-site',
  NEXT_PUBLIC_GITHUB_URL: 'https://github.com/test',
  NEXT_PUBLIC_LINKEDIN_URL: 'https://www.linkedin.com/in/test',
  NEXT_PUBLIC_REPO_URL: 'https://github.com/test/test',
  NEXT_PUBLIC_SENTRY_DSN: 'https://abc@o0.ingest.sentry.io/0'
};

export class ClientConfiguration {
  private static cached: ClientEnvironment | null = null;

  static get(): ClientEnvironment {
    if (ClientConfiguration.cached) return ClientConfiguration.cached;
    ClientConfiguration.cached = parseClientEnvironment(readClientEnv());
    return ClientConfiguration.cached;
  }

  static forTesting(overrides: ClientEnvironmentRawInput = {}): ClientEnvironment {
    ClientConfiguration.cached = parseClientEnvironment({ ...CLIENT_TEST_DEFAULTS, ...overrides });
    return ClientConfiguration.cached;
  }

  static reset(): void {
    ClientConfiguration.cached = null;
  }
}

function readClientEnv(): Record<keyof ClientEnvironment, string | undefined> {
  return {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_GITHUB_URL: process.env.NEXT_PUBLIC_GITHUB_URL,
    NEXT_PUBLIC_LINKEDIN_URL: process.env.NEXT_PUBLIC_LINKEDIN_URL,
    NEXT_PUBLIC_REPO_URL: process.env.NEXT_PUBLIC_REPO_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
  };
}

function parseClientEnvironment(rawEnv: Record<string, string | undefined>): ClientEnvironment {
  const result = ClientEnvironmentSchema.safeParse(rawEnv);
  if (result.success) return result.data;
  throw formatZodIssues('Client environment validation failed', result.error.issues);
}

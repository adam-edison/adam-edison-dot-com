import { Environment } from './EnvironmentSchema';

export function checkProductionRequirements(env: Environment): string[] {
  if (env.NODE_ENV !== 'production') return [];

  const issues: string[] = [];

  if (!env.SENTRY_DSN) {
    issues.push('SENTRY_DSN: required in production for server-side error reporting');
  }

  if (!env.NEXT_PUBLIC_SENTRY_DSN) {
    issues.push('NEXT_PUBLIC_SENTRY_DSN: required in production for client-side error reporting');
  }

  return issues;
}

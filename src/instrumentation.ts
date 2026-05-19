import * as Sentry from '@sentry/nextjs';
import { shouldInitSentry } from '@/shared/observability/shouldInitSentry';

const supportedRuntimes = new Set(['nodejs', 'edge']);

function isSupportedRuntime(): boolean {
  return supportedRuntimes.has(process.env.NEXT_RUNTIME ?? '');
}

function resolveSentryEnvironment(): string | undefined {
  return process.env.NETLIFY_CONTEXT ?? process.env.NODE_ENV;
}

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!shouldInitSentry(dsn)) return;
  if (!isSupportedRuntime()) return;

  Sentry.init({
    dsn,
    environment: resolveSentryEnvironment(),
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    enableLogs: true
  });
}

export const onRequestError = Sentry.captureRequestError;

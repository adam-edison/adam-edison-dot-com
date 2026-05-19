import * as Sentry from '@sentry/nextjs';

const supportedRuntimes = new Set(['nodejs', 'edge']);
const SENTRY_DISABLED_HOST = 'e2e.invalid';

function shouldInit(): boolean {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return false;
  if (dsn.includes(SENTRY_DISABLED_HOST)) return false;
  return supportedRuntimes.has(process.env.NEXT_RUNTIME ?? '');
}

function resolveSentryEnvironment(): string | undefined {
  return process.env.NETLIFY_CONTEXT ?? process.env.NODE_ENV;
}

export async function register() {
  if (!shouldInit()) return;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: resolveSentryEnvironment(),
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    enableLogs: true
  });
}

export const onRequestError = Sentry.captureRequestError;

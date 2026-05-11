import * as Sentry from '@sentry/nextjs';

const supportedRuntimes = new Set(['nodejs', 'edge']);

function shouldInit(): boolean {
  if (!process.env.SENTRY_DSN) return false;
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
    sendDefaultPii: false
  });
}

export const onRequestError = Sentry.captureRequestError;

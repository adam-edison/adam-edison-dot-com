import * as Sentry from '@sentry/nextjs';

const supportedRuntimes = new Set(['nodejs', 'edge']);

export async function register() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  if (!supportedRuntimes.has(process.env.NEXT_RUNTIME ?? '')) return;

  Sentry.init({
    dsn,
    environment: process.env.NETLIFY_CONTEXT ?? process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    sendDefaultPii: false
  });
}

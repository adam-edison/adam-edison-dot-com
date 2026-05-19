import * as Sentry from '@sentry/nextjs';

const SENTRY_DISABLED_HOST = 'e2e.invalid';

function shouldInit(dsn: string | undefined): dsn is string {
  if (!dsn) return false;
  return !dsn.includes(SENTRY_DISABLED_HOST);
}

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (shouldInit(dsn)) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    enableLogs: true
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

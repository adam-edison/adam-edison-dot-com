import * as Sentry from '@sentry/nextjs';

function shouldInit(dsn: string | undefined): dsn is string {
  if (process.env.NEXT_PUBLIC_SENTRY_DISABLED === 'true') return false;
  if (!dsn) return false;
  return true;
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

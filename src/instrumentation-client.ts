import * as Sentry from '@sentry/nextjs';
import { shouldInitSentry } from '@/shared/observability/shouldInitSentry';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (shouldInitSentry(dsn)) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    sendDefaultPii: false,
    enableLogs: true
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

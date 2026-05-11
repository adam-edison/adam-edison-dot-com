import * as Sentry from '@sentry/nextjs';

function findFirstError(args: unknown[]): Error | undefined {
  return args.find((arg): arg is Error => arg instanceof Error);
}

export const sentryReporter = {
  reportError(message: string, args: unknown[]): void {
    const errorArg = findFirstError(args);
    if (errorArg) {
      Sentry.captureException(errorArg);
      return;
    }
    Sentry.captureMessage(message, 'error');
  }
};

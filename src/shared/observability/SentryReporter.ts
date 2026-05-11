import * as Sentry from '@sentry/nextjs';

function findFirstError(loggerArgs: unknown[]): Error | undefined {
  return loggerArgs.find((arg): arg is Error => arg instanceof Error);
}

function hasStringComponentStack(arg: unknown): arg is { componentStack: string } {
  if (typeof arg !== 'object' || arg === null) return false;
  if (!('componentStack' in arg)) return false;

  return typeof (arg as Record<string, unknown>).componentStack === 'string';
}

function findReactErrorInfo(loggerArgs: unknown[]): { componentStack: string } | undefined {
  return loggerArgs.find(hasStringComponentStack);
}

function buildCaptureContext(
  errorInfo: { componentStack: string } | undefined
): Parameters<typeof Sentry.captureException>[1] {
  if (!errorInfo) return undefined;
  return { contexts: { react: errorInfo } };
}

export class SentryReporter {
  static reportError(message: string, loggerArgs: unknown[]): void {
    const errorArg = findFirstError(loggerArgs);
    if (errorArg) {
      Sentry.captureException(errorArg, buildCaptureContext(findReactErrorInfo(loggerArgs)));
      return;
    }
    Sentry.captureMessage(message, 'error');
  }
}

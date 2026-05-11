import * as Sentry from '@sentry/nextjs';

function findFirstError(args: unknown[]): Error | undefined {
  return args.find((arg): arg is Error => arg instanceof Error);
}

function asReactErrorInfo(arg: unknown): { componentStack: string } | undefined {
  if (typeof arg !== 'object' || arg === null) return undefined;
  if (!('componentStack' in arg)) return undefined;

  const value = (arg as { componentStack: unknown }).componentStack;
  if (typeof value !== 'string') return undefined;

  return { componentStack: value };
}

function findReactErrorInfo(args: unknown[]): { componentStack: string } | undefined {
  for (const arg of args) {
    const errorInfo = asReactErrorInfo(arg);
    if (errorInfo) return errorInfo;
  }
  return undefined;
}

function buildCaptureContext(
  errorInfo: { componentStack: string } | undefined
): Parameters<typeof Sentry.captureException>[1] {
  if (!errorInfo) return undefined;
  return { contexts: { react: errorInfo } };
}

export const sentryReporter = {
  reportError(message: string, args: unknown[]): void {
    const errorArg = findFirstError(args);
    if (errorArg) {
      Sentry.captureException(errorArg, buildCaptureContext(findReactErrorInfo(args)));
      return;
    }
    Sentry.captureMessage(message, 'error');
  }
};

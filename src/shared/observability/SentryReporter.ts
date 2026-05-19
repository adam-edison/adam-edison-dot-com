import * as Sentry from '@sentry/nextjs';

export type SentryLevel = 'error' | 'warning' | 'info' | 'debug';

export interface BoundaryReactErrorInfo {
  componentStack?: string | null;
}

export interface BoundaryCaptureContext {
  errorInfo?: BoundaryReactErrorInfo;
  source?: string;
}

const levelToLoggerMethod: Record<SentryLevel, 'error' | 'warn' | 'info' | 'debug'> = {
  error: 'error',
  warning: 'warn',
  info: 'info',
  debug: 'debug'
};

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

function toLogAttributes(loggerArgs: unknown[]): Record<string, unknown> {
  const attributes: Record<string, unknown> = {};
  loggerArgs.forEach((arg, index) => {
    attributes[`arg_${index}`] = arg;
  });
  return attributes;
}

function hasUsableComponentStack(
  errorInfo: BoundaryReactErrorInfo | undefined
): errorInfo is { componentStack: string } {
  return typeof errorInfo?.componentStack === 'string';
}

function buildBoundaryContexts(context: BoundaryCaptureContext): Record<string, Record<string, unknown>> {
  const contexts: Record<string, Record<string, unknown>> = {};
  if (hasUsableComponentStack(context.errorInfo)) contexts.react = { componentStack: context.errorInfo.componentStack };
  if (context.source) contexts.boundary = { source: context.source };
  return contexts;
}

function buildCaptureContext(context: BoundaryCaptureContext): Parameters<typeof Sentry.captureException>[1] {
  const contexts = buildBoundaryContexts(context);
  if (Object.keys(contexts).length === 0) return undefined;
  return { contexts };
}

export class SentryReporter {
  static report(level: SentryLevel, message: string, loggerArgs: unknown[]): void {
    const errorArg = findFirstError(loggerArgs);
    if (errorArg) {
      SentryReporter.captureException(errorArg, { errorInfo: findReactErrorInfo(loggerArgs) });
      return;
    }
    SentryReporter.log(level, message, toLogAttributes(loggerArgs));
  }

  static captureException(error: Error, context: BoundaryCaptureContext = {}): void {
    Sentry.captureException(error, buildCaptureContext(context));
  }

  static log(level: SentryLevel, message: string, attributes?: Record<string, unknown>): void {
    const method = levelToLoggerMethod[level];
    Sentry.logger[method](message, attributes);
  }
}

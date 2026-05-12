import { describe, it, expect, beforeEach, vi } from 'vitest';

type SentryModule = typeof import('@sentry/nextjs');
type SentryReporterModule = typeof import('@/shared/observability/SentryReporter');

let Sentry: SentryModule;
let SentryReporter: SentryReporterModule['SentryReporter'];

async function loadModulesWithMockedSentry() {
  vi.resetModules();
  vi.doMock('@sentry/nextjs', () => ({
    captureException: vi.fn(),
    logger: {
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    }
  }));

  Sentry = await import('@sentry/nextjs');
  ({ SentryReporter } = await import('@/shared/observability/SentryReporter'));
}

describe('SentryReporter.report', () => {
  beforeEach(async () => {
    await loadModulesWithMockedSentry();
  });

  it('forwards an Error with React errorInfo to captureException with contexts.react', () => {
    const error = new Error('boom');
    const errorInfo = { componentStack: 'stack-trace-here' };

    SentryReporter.report('error', 'whatever', [error, errorInfo]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, { contexts: { react: errorInfo } }]]);
    expect(vi.mocked(Sentry.logger.error).mock.calls).toEqual([]);
  });

  it('forwards an Error without errorInfo to captureException with no context', () => {
    const error = new Error('boom');

    SentryReporter.report('error', 'whatever', [error, { unrelated: 'metadata' }]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, undefined]]);
    expect(vi.mocked(Sentry.logger.error).mock.calls).toEqual([]);
  });

  it('routes error-level messages without an Error to Sentry.logger.error', () => {
    SentryReporter.report('error', 'something went wrong', ['extra string']);

    expect(vi.mocked(Sentry.logger.error).mock.calls).toEqual([['something went wrong', { arg_0: 'extra string' }]]);
    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([]);
  });

  it('routes warning, info, and debug levels through Sentry.logger.*', () => {
    SentryReporter.report('warning', 'rate limit close', [{ remaining: 1 }]);
    SentryReporter.report('info', 'email sent', [{ recipient: 'user@example.com' }]);
    SentryReporter.report('debug', 'config loaded', [{ keys: 5 }]);

    expect(vi.mocked(Sentry.logger.warn).mock.calls).toEqual([['rate limit close', { arg_0: { remaining: 1 } }]]);
    expect(vi.mocked(Sentry.logger.info).mock.calls).toEqual([
      ['email sent', { arg_0: { recipient: 'user@example.com' } }]
    ]);
    expect(vi.mocked(Sentry.logger.debug).mock.calls).toEqual([['config loaded', { arg_0: { keys: 5 } }]]);
    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([]);
  });

  it('ignores non-string componentStack values when picking React errorInfo', () => {
    const error = new Error('boom');
    const badErrorInfo = { componentStack: 42 };

    SentryReporter.report('error', 'whatever', [error, badErrorInfo]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, undefined]]);
  });
});

describe('SentryReporter.captureException', () => {
  beforeEach(async () => {
    await loadModulesWithMockedSentry();
  });

  it('forwards a bare error with no extra context', () => {
    const error = new Error('boom');

    SentryReporter.captureException(error);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, undefined]]);
  });

  it('attaches React errorInfo under contexts.react when provided', () => {
    const error = new Error('boom');
    const errorInfo = { componentStack: 'stack-trace-here' };

    SentryReporter.captureException(error, { errorInfo });

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, { contexts: { react: errorInfo } }]]);
  });

  it('attaches the boundary source label under contexts.boundary when provided', () => {
    const error = new Error('boom');

    SentryReporter.captureException(error, { source: 'unhandled application error' });

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([
      [error, { contexts: { boundary: { source: 'unhandled application error' } } }]
    ]);
  });

  it('attaches both errorInfo and source when both are provided', () => {
    const error = new Error('boom');
    const errorInfo = { componentStack: 'stack-trace-here' };

    SentryReporter.captureException(error, { errorInfo, source: 'contact form error boundary' });

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([
      [error, { contexts: { react: errorInfo, boundary: { source: 'contact form error boundary' } } }]
    ]);
  });
});

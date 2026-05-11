import { describe, it, expect, beforeEach, vi } from 'vitest';

type SentryModule = typeof import('@sentry/nextjs');
type SentryReporterModule = typeof import('@/shared/observability/SentryReporter');

let Sentry: SentryModule;
let SentryReporter: SentryReporterModule['SentryReporter'];

async function loadModulesWithMockedSentry() {
  vi.resetModules();
  vi.doMock('@sentry/nextjs', () => ({
    captureException: vi.fn(),
    captureMessage: vi.fn()
  }));

  Sentry = await import('@sentry/nextjs');
  ({ SentryReporter } = await import('@/shared/observability/SentryReporter'));
}

describe('SentryReporter.reportError', () => {
  beforeEach(async () => {
    await loadModulesWithMockedSentry();
  });

  it('forwards an Error with React errorInfo to captureException with contexts.react', () => {
    const error = new Error('boom');
    const errorInfo = { componentStack: 'stack-trace-here' };

    SentryReporter.reportError('whatever', [error, errorInfo]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, { contexts: { react: errorInfo } }]]);
    expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([]);
  });

  it('forwards an Error without errorInfo to captureException with no context', () => {
    const error = new Error('boom');

    SentryReporter.reportError('whatever', [error, { unrelated: 'metadata' }]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, undefined]]);
    expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([]);
  });

  it('falls back to captureMessage when no Error is present in args', () => {
    SentryReporter.reportError('something went wrong', ['extra string']);

    expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([['something went wrong', 'error']]);
    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([]);
  });

  it('ignores non-string componentStack values when picking React errorInfo', () => {
    const error = new Error('boom');
    const badErrorInfo = { componentStack: 42 };

    SentryReporter.reportError('whatever', [error, badErrorInfo]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, undefined]]);
  });
});

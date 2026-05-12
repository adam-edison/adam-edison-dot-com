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

describe('SentryReporter.report', () => {
  beforeEach(async () => {
    await loadModulesWithMockedSentry();
  });

  it('forwards an Error with React errorInfo to captureException with contexts.react', () => {
    const error = new Error('boom');
    const errorInfo = { componentStack: 'stack-trace-here' };

    SentryReporter.report('error', 'whatever', [error, errorInfo]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, { contexts: { react: errorInfo } }]]);
    expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([]);
  });

  it('forwards an Error without errorInfo to captureException with no context', () => {
    const error = new Error('boom');

    SentryReporter.report('error', 'whatever', [error, { unrelated: 'metadata' }]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, undefined]]);
    expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([]);
  });

  it('falls back to captureMessage with the supplied level when no Error is present in args', () => {
    SentryReporter.report('error', 'something went wrong', ['extra string']);

    expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([['something went wrong', 'error']]);
    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([]);
  });

  it('propagates non-error levels through captureMessage', () => {
    SentryReporter.report('warning', 'rate limit close', []);
    SentryReporter.report('info', 'email sent', []);
    SentryReporter.report('debug', 'config loaded', []);

    expect(vi.mocked(Sentry.captureMessage).mock.calls).toEqual([
      ['rate limit close', 'warning'],
      ['email sent', 'info'],
      ['config loaded', 'debug']
    ]);
    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([]);
  });

  it('ignores non-string componentStack values when picking React errorInfo', () => {
    const error = new Error('boom');
    const badErrorInfo = { componentStack: 42 };

    SentryReporter.report('error', 'whatever', [error, badErrorInfo]);

    expect(vi.mocked(Sentry.captureException).mock.calls).toEqual([[error, undefined]]);
  });
});

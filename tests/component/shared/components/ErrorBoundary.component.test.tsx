import type { ReactElement } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { SentryReporter } from '@/shared/observability/SentryReporter';

function ExplodingChild({ error }: { error: Error }): ReactElement {
  throw error;
}

describe('ErrorBoundary', () => {
  let captureSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    captureSpy = vi.spyOn(SentryReporter, 'captureException').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    captureSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>safe content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('renders the fallback UI and forwards the thrown error plus React errorInfo to the Sentry reporter', () => {
    const renderError = new Error('boom');

    render(
      <ErrorBoundary>
        <ExplodingChild error={renderError} />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Application Error/)).toBeInTheDocument();
    expect(captureSpy.mock.calls.length).toBe(1);

    const [forwardedError, forwardedContext] = captureSpy.mock.calls[0] as [
      Error,
      { errorInfo?: { componentStack: string }; source?: string }
    ];
    expect(forwardedError).toBe(renderError);
    expect(forwardedContext.source).toBe('unhandled application error');
    expect(typeof forwardedContext.errorInfo?.componentStack).toBe('string');
  });
});

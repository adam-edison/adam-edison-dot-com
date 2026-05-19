import type { ReactElement } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContactFormErrorBoundary } from '@/features/contact/components/ContactFormErrorBoundary';
import { SentryReporter } from '@/shared/observability/SentryReporter';

function ExplodingChild({ error }: { error: Error }): ReactElement {
  throw error;
}

describe('ContactFormErrorBoundary', () => {
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
      <ContactFormErrorBoundary>
        <div>safe content</div>
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText('safe content')).toBeInTheDocument();
  });

  it('renders the fallback UI and forwards the thrown error plus React errorInfo to the Sentry reporter', () => {
    const renderError = new Error('boom');

    render(
      <ContactFormErrorBoundary>
        <ExplodingChild error={renderError} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong with the contact form/)).toBeInTheDocument();
    expect(captureSpy.mock.calls.length).toBe(1);

    const [forwardedError, forwardedContext] = captureSpy.mock.calls[0] as [
      Error,
      { errorInfo?: { componentStack: string }; source?: string }
    ];
    expect(forwardedError).toBe(renderError);
    expect(forwardedContext.source).toBe('contact form error boundary');
    expect(typeof forwardedContext.errorInfo?.componentStack).toBe('string');
  });
});

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
  let reportErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reportErrorSpy = vi.spyOn(SentryReporter, 'reportError').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    reportErrorSpy.mockRestore();
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
    expect(reportErrorSpy.mock.calls.length).toBe(1);

    const forwardedArgs = reportErrorSpy.mock.calls[0][1] as unknown[];
    expect(forwardedArgs[0]).toBe(renderError);

    const errorInfo = forwardedArgs[1] as { componentStack: string };
    expect(typeof errorInfo.componentStack).toBe('string');
  });
});

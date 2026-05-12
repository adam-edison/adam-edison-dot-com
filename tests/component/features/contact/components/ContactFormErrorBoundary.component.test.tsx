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
  let reportSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reportSpy = vi.spyOn(SentryReporter, 'report').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    reportSpy.mockRestore();
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
    expect(reportSpy.mock.calls.length).toBe(1);

    const [level, , forwardedArgs] = reportSpy.mock.calls[0] as [string, string, unknown[]];
    expect(level).toBe('error');
    expect(forwardedArgs[0]).toBe(renderError);

    const errorInfo = forwardedArgs[1] as { componentStack: string };
    expect(typeof errorInfo.componentStack).toBe('string');
  });
});

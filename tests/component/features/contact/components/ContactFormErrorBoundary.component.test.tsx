import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContactFormErrorBoundary } from '@/features/contact/components/ContactFormErrorBoundary';
import { sentryReporter } from '@/shared/observability/sentryReporter';

function ExplodingChild({ error }: { error: Error }): never {
  throw error;
}

describe('ContactFormErrorBoundary', () => {
  let reportErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    reportErrorSpy = vi.spyOn(sentryReporter, 'reportError').mockImplementation(() => undefined);
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

  it('renders the fallback UI and reports the error with React errorInfo to Sentry', () => {
    const renderError = new Error('boom');

    render(
      <ContactFormErrorBoundary>
        <ExplodingChild error={renderError} />
      </ContactFormErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong with the contact form/)).toBeInTheDocument();
    expect(reportErrorSpy.mock.calls.length).toBe(1);

    const [forwardedMessage, forwardedArgs] = reportErrorSpy.mock.calls[0];
    expect(forwardedMessage).toBe('Contact form error boundary caught an error:');
    expect(forwardedArgs).toContain(renderError);

    const errorInfo = forwardedArgs.find(
      (arg: unknown) => typeof arg === 'object' && arg !== null && 'componentStack' in arg
    ) as { componentStack: string } | undefined;
    expect(typeof errorInfo?.componentStack).toBe('string');
  });
});

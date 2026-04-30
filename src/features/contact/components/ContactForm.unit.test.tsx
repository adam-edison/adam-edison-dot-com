import { expect, test, describe, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ContactForm } from './ContactForm';
import { logger } from '@/shared/Logger';

interface TurnstileMock {
  render: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  __lastOptions?: Parameters<NonNullable<typeof window.turnstile>['render']>[1];
}

function installTurnstileMock(): TurnstileMock {
  const mock: TurnstileMock = {
    render: vi.fn(),
    remove: vi.fn(),
    reset: vi.fn()
  };
  mock.render.mockImplementation((_el, options) => {
    mock.__lastOptions = options;
    return 'widget-id-test';
  });
  window.turnstile = mock as unknown as typeof window.turnstile;
  return mock;
}

function uninstallTurnstileMock(): void {
  delete window.turnstile;
}

function fireTurnstileSuccess(token: string): void {
  const turnstileMock = window.turnstile as unknown as TurnstileMock;
  act(() => {
    turnstileMock.__lastOptions!.callback(token);
  });
}

function fireTurnstileError(error: string): void {
  const turnstileMock = window.turnstile as unknown as TurnstileMock;
  act(() => {
    turnstileMock.__lastOptions!['error-callback']!(error);
  });
}

function fireTurnstileExpire(): void {
  const turnstileMock = window.turnstile as unknown as TurnstileMock;
  act(() => {
    turnstileMock.__lastOptions!['expired-callback']!();
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installTurnstileMock();

    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-secret-key');
    vi.stubEnv('SEND_EMAIL_ENABLED', 'false');

    fetchMock = vi.fn().mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/email-service-check')) {
        return new Response(JSON.stringify({ status: 'healthy' }), {
          status: 200,
          statusText: 'OK'
        });
      }

      return new Response(JSON.stringify({ message: 'Message sent successfully' }), {
        status: 200,
        statusText: 'OK'
      });
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    uninstallTurnstileMock();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const fillOutForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^email address/i), 'john@example.com');
    await user.type(
      screen.getByLabelText(/message/i),
      'This is a test message with enough characters to meet the minimum requirement.'
    );
  };

  test('should render the contact form', async () => {
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /loading security verification/i })).toBeInTheDocument();
  });

  test('should successfully submit the form when Turnstile token is captured', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await fillOutForm(user);
    fireTurnstileSuccess('issued-token-abc');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          message: 'This is a test message with enough characters to meet the minimum requirement.',
          turnstileToken: 'issued-token-abc'
        })
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/message sent!/i)).toBeInTheDocument();
    });
  });

  test('should keep submit button disabled until Turnstile token is captured', async () => {
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /loading security verification/i })).toBeDisabled();

    fireTurnstileSuccess('issued-token-abc');

    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled();
  });

  test('should re-disable submit button when Turnstile widget reports an error', async () => {
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    fireTurnstileSuccess('issued-token-abc');
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled();

    fireTurnstileError('network-error');

    expect(screen.getByRole('button', { name: /loading security verification/i })).toBeDisabled();
  });

  test('should re-disable submit button when the Turnstile token expires', async () => {
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    fireTurnstileSuccess('issued-token-abc');
    expect(screen.getByRole('button', { name: /send message/i })).toBeEnabled();

    fireTurnstileExpire();

    expect(screen.getByRole('button', { name: /loading security verification/i })).toBeDisabled();
  });

  test('should display friendly error when API rejects the captcha', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/email-service-check')) {
        return new Response(JSON.stringify({ status: 'healthy' }), {
          status: 200,
          statusText: 'OK'
        });
      }

      return new Response(JSON.stringify({ message: 'Captcha verification failed. Please try again.' }), {
        status: 400,
        statusText: 'Bad Request'
      });
    });

    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await fillOutForm(user);
    fireTurnstileSuccess('bad-token');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/captcha verification failed/i)).toBeInTheDocument();
    });
  });

  test('should display error message when API returns error', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/email-service-check')) {
        return new Response(JSON.stringify({ status: 'healthy' }), {
          status: 200,
          statusText: 'OK'
        });
      }

      return new Response(JSON.stringify({ message: 'Failed to send message' }), {
        status: 500,
        statusText: 'Internal Server Error'
      });
    });

    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await fillOutForm(user);
    fireTurnstileSuccess('valid-token');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });
  });

  test('should display error message when fetch fails', async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/email-service-check')) {
        return new Response(JSON.stringify({ status: 'healthy' }), {
          status: 200,
          statusText: 'OK'
        });
      }

      throw new Error('Network error');
    });

    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await fillOutForm(user);
    fireTurnstileSuccess('valid-token');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      const output = logger.getOutput();
      expect(output).toContain('ERROR Contact form submission error');
    });
  });

  test('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    fireTurnstileSuccess('issued-token-abc');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  test('should reset form after successful submission', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await fillOutForm(user);
    fireTurnstileSuccess('valid-token');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/message sent!/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /send another message/i }));

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  test('should display error message when server configuration is missing', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/email-service-check')) {
        return new Response(
          JSON.stringify({
            error: 'Email service configuration validation failed'
          }),
          {
            status: 503,
            statusText: 'Service Unavailable'
          }
        );
      }

      return new Response(JSON.stringify({ message: 'Should not reach here' }), {
        status: 200,
        statusText: 'OK'
      });
    });

    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByText(/contact form is not available/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/missing configuration/i)).not.toBeInTheDocument();
  });

  test('should log error when config check fails', async () => {
    fetchMock.mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/email-service-check')) {
        throw new Error('Config check failed');
      }

      return new Response(JSON.stringify({ message: 'Should not reach here' }), {
        status: 200,
        statusText: 'OK'
      });
    });

    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByText(/contact form is not available/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      const output = logger.getOutput();
      expect(output).toContain('ERROR Failed to check server configuration');
    });
  });
});

import { expect, test, describe, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ContactForm } from './ContactForm';
import { logger } from '@/shared/Logger';

// Mock the anti-bot service
vi.mock('@/features/contact/AntiBotService', () => ({
  AntiBotService: {
    create: () => ({
      generateMathChallenge: () => ({ num1: 3, num2: 4, question: 'What is 3 + 4?', correctAnswer: 7 }),
      createFormInitialData: () => ({
        subject: '',
        phone: '',
        formLoadTime: Date.now(),
        mathAnswer: '',
        mathNum1: 3,
        mathNum2: 4
      }),
      validateAntiBotData: () => ({ isValid: true })
    })
  }
}));

global.fetch = vi.fn() as unknown as typeof fetch;

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.stubEnv('SEND_EMAIL_ENABLED', 'false');

    vi.mocked(fetch).mockImplementation(async (url) => {
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
  });

  const fillOutForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^email address/i), 'john@example.com');
    await user.type(
      screen.getByLabelText(/message/i),
      'This is a test message with enough characters to meet the minimum requirement.'
    );

    // Fill math answer
    const mathQuestion = screen.getByTestId('math-question').textContent;
    const match = mathQuestion?.match(/(\d+) \+ (\d+)/);
    if (match) {
      const answer = parseInt(match[1]) + parseInt(match[2]);
      await user.type(screen.getByTestId('math-answer'), answer.toString());
    }
  };

  test('should render the contact form', async () => {
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('should successfully submit the form with valid data', async () => {
    const user = userEvent.setup();
    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await fillOutForm(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"firstName":"John"')
      });
    });

    await waitFor(() => {
      expect(screen.getByText(/message sent!/i)).toBeInTheDocument();
    });
  });

  test('should display error message when anti-bot validation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (url) => {
      if (typeof url === 'string' && url.includes('/api/email-service-check')) {
        return new Response(JSON.stringify({ status: 'healthy' }), {
          status: 200,
          statusText: 'OK'
        });
      }

      return new Response(JSON.stringify({ message: 'Security verification failed' }), {
        status: 400,
        statusText: 'Bad Request'
      });
    });

    render(<ContactForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    await fillOutForm(user);
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/security verification failed/i)).toBeInTheDocument();
    });
  });

  test('should display error message when API returns error', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (url) => {
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
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
    });
  });

  // TODO: Add tests for reCAPTCHA warning scenarios
  // These require more complex mocking due to the module system
  // For now, we have verified that the logger is working in error scenarios

  // Note: Testing reCAPTCHA "not ready" state requires more complex mocking
  // This scenario is better tested manually by commenting out NEXT_PUBLIC_RECAPTCHA_SITE_KEY

  test('should display error message when fetch fails', async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockImplementation(async (url) => {
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
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText(/message sent!/i)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /send another message/i }));

    // Form should be reset (back to form view, not success message)
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
  });

  test('should display error message when server configuration is missing', async () => {
    vi.mocked(fetch).mockImplementation(async (url) => {
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
    vi.mocked(fetch).mockImplementation(async (url) => {
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

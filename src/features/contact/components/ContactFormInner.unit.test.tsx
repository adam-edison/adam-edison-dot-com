import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactFormInner } from './ContactFormInner';

// Mock fetch
global.fetch = vi.fn();

// Mock TurnstileWidget
vi.mock('./TurnstileWidget', () => ({
  TurnstileWidget: ({ onVerify, onExpire }: { onVerify: (token: string) => void; onExpire: () => void }) => {
    // Store callbacks globally so tests can trigger them
    (
      window as typeof window & { __turnstileCallbacks?: { onVerify: (token: string) => void; onExpire: () => void } }
    ).__turnstileCallbacks = { onVerify, onExpire };
    return (
      <div data-testid="turnstile-widget">
        <button onClick={() => onVerify('test-token')}>Complete Verification</button>
      </div>
    );
  }
}));

describe('ContactFormInner', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any stored callbacks
    delete (
      window as typeof window & { __turnstileCallbacks?: { onVerify: (token: string) => void; onExpire: () => void } }
    ).__turnstileCallbacks;
    // Mock environment variable
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'test-site-key');

    // Mock fetch for different endpoints
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-csrf-token' })
        });
      }
      if (url === '/api/email-service-check') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'healthy',
              services: {
                email: { enabled: true, ready: true },
                turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
              }
            })
        });
      }
      if (url === '/api/contact') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Success' })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Not found' })
      });
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should render all form fields', async () => {
    render(<ContactFormInner />);

    // Wait for the component to finish loading
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    // When Turnstile is enabled, button shows different text
    expect(screen.getByRole('button', { name: /complete security verification to submit/i })).toBeInTheDocument();
  });

  it('should submit form successfully with valid data', async () => {
    render(<ContactFormInner />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Complete Turnstile verification first
    await user.click(screen.getByText('Complete Verification'));

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test-csrf-token'
        },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          message: 'Test message with enough characters to pass validation',
          turnstileToken: 'test-token'
        })
      });
    });

    // Should show success message
    expect(screen.getByText('Message Sent!')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    // Mock the contact API to return an error
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-csrf-token' })
        });
      }
      if (url === '/api/email-service-check') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'healthy',
              services: {
                email: { enabled: true, ready: true },
                turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
              }
            })
        });
      }
      if (url === '/api/contact') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Server error' })
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Not found' })
      });
    });

    render(<ContactFormInner />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Complete Turnstile verification first
    await user.click(screen.getByText('Complete Verification'));

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });
  });

  it('should handle network errors gracefully', async () => {
    // Mock the contact API to throw a network error
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-csrf-token' })
        });
      }
      if (url === '/api/email-service-check') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'healthy',
              services: {
                email: { enabled: true, ready: true },
                turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
              }
            })
        });
      }
      if (url === '/api/contact') {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Not found' })
      });
    });

    render(<ContactFormInner />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Complete Turnstile verification first
    await user.click(screen.getByText('Complete Verification'));

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should disable submit button while submitting', async () => {
    // Mock delayed response to observe loading state
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url === '/api/csrf-token') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-csrf-token' })
        });
      }
      if (url === '/api/email-service-check') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              status: 'healthy',
              services: {
                email: { enabled: true, ready: true },
                turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
              }
            })
        });
      }
      if (url === '/api/contact') {
        return new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ message: 'Success' })
              }),
            100
          )
        );
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Not found' })
      });
    });

    render(<ContactFormInner />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Complete Turnstile verification first
    await user.click(screen.getByText('Complete Verification'));

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

    const submitButton = screen.getByRole('button', { name: /send message/i });

    // Submit form
    await user.click(submitButton);

    // Button should be disabled while submitting
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Sending...');

    await waitFor(() => {
      expect(screen.getByText('Message Sent!')).toBeInTheDocument();
    });
  });

  it('should reset form after successful submission', async () => {
    render(<ContactFormInner />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Complete Turnstile verification first
    await user.click(screen.getByText('Complete Verification'));

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText('Message Sent!')).toBeInTheDocument();
    });

    // Click "Send another message" to show the form again
    await user.click(screen.getByText(/send another message/i));

    // Form should be reset
    expect(screen.getByLabelText(/first name/i)).toHaveValue('');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/message/i)).toHaveValue('');
  });

  it('should show character count for message field', async () => {
    render(<ContactFormInner />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    const messageField = screen.getByLabelText(/message/i);

    // Initially should show 0/1000
    expect(screen.getByText('0/1000')).toBeInTheDocument();

    // Type some text
    await user.type(messageField, 'Hello world');

    // Should update character count
    expect(screen.getByText('11/1000')).toBeInTheDocument();
  });

  it('should validate form fields before submission', async () => {
    render(<ContactFormInner />);

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Try to submit without filling fields
    // Button should be disabled until Turnstile is verified
    const submitButton = screen.getByRole('button', { name: /complete security verification to submit/i });
    expect(submitButton).toBeDisabled();

    // Complete Turnstile verification
    await user.click(screen.getByText('Complete Verification'));

    // Now try to submit without filling fields
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Should show validation errors (handled by react-hook-form)
    await waitFor(() => {
      // Fetch should only be called for initialization (csrf-token and service-check)
      // but not for the contact form submission
      const contactCalls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.filter(
        (call) => call[0] === '/api/contact'
      );
      expect(contactCalls).toHaveLength(0);
    });
  });

  describe('Turnstile integration', () => {
    it('should render Turnstile widget when site key is configured', async () => {
      render(<ContactFormInner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('turnstile-widget')).toBeInTheDocument();
      });
    });

    it('should not render Turnstile widget when site key is not configured', async () => {
      vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');

      // Mock service check to return disabled turnstile
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
        if (url === '/api/csrf-token') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ token: 'test-csrf-token' })
          });
        }
        if (url === '/api/email-service-check') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                status: 'healthy',
                services: {
                  email: { enabled: true, ready: true },
                  turnstile: { enabled: false, ready: false }
                }
              })
          });
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ message: 'Not found' })
        });
      });

      render(<ContactFormInner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      expect(screen.queryByTestId('turnstile-widget')).not.toBeInTheDocument();
    });

    it('should include Turnstile token in form submission', async () => {
      render(<ContactFormInner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Complete Turnstile verification
      await user.click(screen.getByText('Complete Verification'));

      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

      // Submit form
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'test-csrf-token'
          },
          body: JSON.stringify({
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            message: 'Test message with enough characters to pass validation',
            turnstileToken: 'test-token'
          })
        });
      });
    });

    it('should disable submit button when Turnstile token is not available', async () => {
      render(<ContactFormInner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill out form without completing Turnstile
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

      const submitButton = screen.getByRole('button', { name: /complete security verification to submit/i });

      // Button should be disabled because Turnstile is not verified
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button after Turnstile verification', async () => {
      render(<ContactFormInner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

      // Button should be disabled initially
      expect(screen.getByRole('button', { name: /complete security verification to submit/i })).toBeDisabled();

      // Complete Turnstile verification
      await user.click(screen.getByText('Complete Verification'));

      // Button should now be enabled
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();
      });
    });

    it('should handle Turnstile token expiration', async () => {
      render(<ContactFormInner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Complete Turnstile verification
      await user.click(screen.getByText('Complete Verification'));

      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

      // Button should be enabled
      expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();

      // Simulate token expiration
      const callbacks = (
        window as typeof window & { __turnstileCallbacks?: { onVerify: (token: string) => void; onExpire: () => void } }
      ).__turnstileCallbacks;
      if (callbacks && callbacks.onExpire) {
        act(() => {
          callbacks.onExpire();
        });
      }

      // Button should be disabled again
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete security verification to submit/i })).toBeDisabled();
      });
    });

    it('should reset Turnstile token after successful submission', async () => {
      render(<ContactFormInner />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      });

      // Complete Turnstile verification
      await user.click(screen.getByText('Complete Verification'));

      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'Test');
      await user.type(screen.getByLabelText(/last name/i), 'User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');

      // Submit form
      await user.click(screen.getByRole('button', { name: /send message/i }));

      await waitFor(() => {
        expect(screen.getByText('Message Sent!')).toBeInTheDocument();
      });

      // Click "Send another message"
      await user.click(screen.getByText(/send another message/i));

      // Submit button should be disabled (Turnstile needs to be verified again)
      expect(screen.getByRole('button', { name: /complete security verification to submit/i })).toBeDisabled();
    });
  });
});

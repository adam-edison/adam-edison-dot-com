import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactFormInner } from './ContactFormInner';

// Mock fetch
global.fetch = vi.fn();

describe('ContactFormInner', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
  });

  it('should render all form fields', () => {
    render(<ContactFormInner />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  it('should submit form successfully with valid data', async () => {
    render(<ContactFormInner />);

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          message: 'Test message with enough characters to pass validation'
        })
      });
    });

    // Should show success message
    expect(screen.getByText('Message Sent!')).toBeInTheDocument();
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Server error' })
    });

    render(<ContactFormInner />);

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
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

    render(<ContactFormInner />);

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
    // Delay the response to observe the loading state
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ message: 'Success' })
              }),
            100
          )
        )
    );

    render(<ContactFormInner />);

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

    // Try to submit without filling fields
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Should show validation errors (handled by react-hook-form)
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

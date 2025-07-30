import { expect, test, describe, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContactFormInner } from './ContactFormInner';
import { ContactFormService, ServiceStatus } from '../ContactFormService';

function createMockService(configOrError?: ServiceStatus | Error) {
  const mockService = new ContactFormService();
  vi.spyOn(mockService, 'getCsrfToken').mockResolvedValue('mock-csrf-token');
  vi.spyOn(mockService, 'submitForm').mockResolvedValue({ success: true, message: 'Success' });

  if (configOrError instanceof Error) {
    vi.spyOn(mockService, 'checkServerConfig').mockRejectedValue(configOrError);
    return mockService;
  }

  if (configOrError) {
    vi.spyOn(mockService, 'checkServerConfig').mockResolvedValue(configOrError);
    return mockService;
  }

  // Default successful config with minimal required structure
  vi.spyOn(mockService, 'checkServerConfig').mockResolvedValue({
    status: 'healthy',
    services: {
      email: { enabled: true, ready: true },
      turnstile: { enabled: false, ready: false }
    }
  });

  return mockService;
}

describe('ContactFormInner', () => {
  test('should show loading state initially', async () => {
    const mockService = createMockService();
    render(<ContactFormInner contactService={mockService} />);

    // Should show loading skeleton (form fields not yet rendered)
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();

    // Wait for async operations to complete to avoid act warnings
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });
  });

  test('should render form fields when services load successfully', async () => {
    const mockService = createMockService();
    render(<ContactFormInner contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('should show error when services fail to load', async () => {
    const mockService = createMockService(new Error('Service failed'));
    render(<ContactFormInner contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByText(/service failed/i)).toBeInTheDocument();
    });
  });

  test('should render Turnstile widget when enabled', async () => {
    const mockService = createMockService({
      status: 'healthy',
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
      }
    });

    render(<ContactFormInner contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // When Turnstile is enabled, button shows different text and is disabled
    expect(screen.getByRole('button', { name: /complete security verification/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /complete security verification/i })).toBeDisabled();
  });

  test('should render form without Turnstile when disabled', async () => {
    const mockService = createMockService({
      status: 'healthy',
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: false, ready: false }
      }
    });

    render(<ContactFormInner contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();
  });

  test('should show character count for message field', async () => {
    const mockService = createMockService();
    render(<ContactFormInner contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    // Character counter should be visible
    expect(screen.getByText('0/1000')).toBeInTheDocument();
  });
});

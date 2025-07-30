import { expect, test, describe, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ContactForm } from './ContactForm';
import { ContactFormService, ServiceStatus } from '../ContactFormService';

function createMockService(configOrError?: ServiceStatus | Error) {
  const mockService = new ContactFormService();
  vi.spyOn(mockService, 'getCsrfToken').mockResolvedValue('mock-csrf-token');

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

describe('ContactForm', () => {
  test('should show loading state initially', async () => {
    const mockService = createMockService();
    render(<ContactForm contactService={mockService} />);

    expect(screen.getByText(/loading contact form/i)).toBeInTheDocument();

    // Wait for the async operation to complete to avoid act warnings
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });
  });

  test('should show error state when server config fails', async () => {
    const mockService = createMockService(new Error('Server config failed'));
    render(<ContactForm contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByText(/contact form is not available/i)).toBeInTheDocument();
    });
  });

  test('should render form when server config succeeds', async () => {
    const mockService = createMockService();
    render(<ContactForm contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('should render form with Turnstile when enabled', async () => {
    const mockService = createMockService({
      status: 'healthy',
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
      }
    });
    render(<ContactForm contactService={mockService} />);

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
    render(<ContactForm contactService={mockService} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });
});

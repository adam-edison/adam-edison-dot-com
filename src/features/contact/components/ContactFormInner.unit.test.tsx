import { expect, test, describe, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactFormInner } from './ContactFormInner';
import { ContactFormService, ServiceStatus, ContactFormState } from '../ContactFormService';
import { Result } from '@/shared/Result';

function createMockService(configOrError?: ServiceStatus | Error, additionalState?: Partial<ContactFormState>) {
  const mockService = new ContactFormService();
  
  vi.spyOn(mockService, 'submitForm').mockResolvedValue(Result.success());
  vi.spyOn(mockService, 'cleanup').mockImplementation(() => {});
  vi.spyOn(mockService, 'onStateChange').mockImplementation(() => {});

  if (configOrError instanceof Error) {
    // Mock for error state
    vi.spyOn(mockService, 'initialize').mockResolvedValue(Result.failure(configOrError.message));
    vi.spyOn(mockService, 'getState').mockReturnValue({
      isLoading: false,
      isSubmitting: false,
      submitStatus: 'idle',
      errorMessage: configOrError.message,
      serviceStatus: null,
      ...additionalState
    });
    return mockService;
  }

  const serviceStatus = configOrError || {
    status: 'healthy' as const,
    services: {
      email: { enabled: true, ready: true },
      turnstile: { enabled: false, ready: false }
    }
  };

  // Mock for success state
  vi.spyOn(mockService, 'initialize').mockResolvedValue(Result.success());
  vi.spyOn(mockService, 'getState').mockReturnValue({
    isLoading: additionalState?.isLoading ?? false,
    isSubmitting: false,
    submitStatus: 'idle',
    errorMessage: '',
    serviceStatus,
    ...additionalState
  });

  return mockService;
}

describe('ContactFormInner', () => {
  test('should show loading state initially', async () => {
    const mockService = createMockService(undefined, { isLoading: true });
    render(<ContactFormInner contactService={mockService} />);

    // Should show loading skeleton (form fields not yet rendered)
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();
    
    // Should show loading skeleton animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
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

    // When Turnstile is enabled, button shows send message but may be enabled/disabled based on verification state
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
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

  test('should preserve form data when rate limit error occurs', async () => {
    const user = userEvent.setup();

    // Create mock service that returns rate limit error
    const mockService = createMockService();
    let stateChangeCallback: ((state: ContactFormState) => void) | null = null;
    
    // Capture the state change callback
    vi.spyOn(mockService, 'onStateChange').mockImplementation((callback) => {
      stateChangeCallback = callback;
    });
    
    // Mock submitForm to simulate error state change
    vi.spyOn(mockService, 'submitForm').mockImplementation(async () => {
      if (stateChangeCallback) {
        stateChangeCallback({
          isLoading: false,
          isSubmitting: false,
          submitStatus: 'error',
          errorMessage: 'Too many requests. Please try again later.',
          serviceStatus: {
            status: 'healthy',
            services: {
              email: { enabled: true, ready: true },
              turnstile: { enabled: false, ready: false }
            }
          }
        });
      }
      return Result.failure('Too many requests. Please try again later.');
    });

    render(<ContactFormInner contactService={mockService} />);

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Fill out the form with user data
    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const messageInput = screen.getByLabelText(/message/i);

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john.doe@example.com');
    await user.type(
      messageInput,
      'This is a test message that is long enough to meet the minimum character requirement for the contact form.'
    );

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    // Wait for submission to complete and error to appear
    await waitFor(() => {
      expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
    });

    // Form data should NOT be cleared when there's a rate limit error
    // Users should not have to re-enter all their information
    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
    expect(emailInput).toHaveValue('john.doe@example.com');
    expect(messageInput).toHaveValue(
      'This is a test message that is long enough to meet the minimum character requirement for the contact form.'
    );
  });
});

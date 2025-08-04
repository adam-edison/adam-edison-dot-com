import { expect, test, describe, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactFormInner } from './ContactFormInner';

// Mock the useContactForm hook
const mockUseContactForm = vi.fn();
vi.mock('../presentation/hooks/useContactForm', () => ({
  useContactForm: () => mockUseContactForm()
}));

// Mock logger
vi.mock('@/shared/Logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

interface MockHookReturn {
  formState: {
    isSubmitting: boolean;
    submitStatus: 'idle' | 'success' | 'error';
    errorMessage: string;
    isConfigLoading: boolean;
    serviceConfig: {
      status: 'healthy' | 'degraded';
      services: {
        email: { enabled: boolean; ready: boolean };
        turnstile: { enabled: boolean; ready: boolean; siteKey?: string };
      };
    } | null;
  };
  submitForm: ReturnType<typeof vi.fn>;
  initializeConfig: ReturnType<typeof vi.fn>;
  initializeTurnstile: ReturnType<typeof vi.fn>;
  cleanup: ReturnType<typeof vi.fn>;
}

function createMockHookReturn(overrides: Partial<MockHookReturn> = {}): MockHookReturn {
  return {
    formState: {
      isSubmitting: false,
      submitStatus: 'idle' as const,
      errorMessage: '',
      isConfigLoading: false,
      serviceConfig: {
        status: 'healthy' as const,
        services: {
          email: { enabled: true, ready: true },
          turnstile: { enabled: false, ready: false }
        }
      },
      ...overrides.formState
    },
    submitForm: vi.fn().mockResolvedValue({ success: true }),
    initializeConfig: vi.fn(),
    initializeTurnstile: vi.fn(),
    cleanup: vi.fn(),
    ...overrides
  };
}

describe('ContactFormInner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should show loading state initially', async () => {
    mockUseContactForm.mockReturnValue(
      createMockHookReturn({
        formState: {
          isSubmitting: false,
          submitStatus: 'idle' as const,
          errorMessage: '',
          isConfigLoading: true,
          serviceConfig: null
        }
      })
    );

    render(<ContactFormInner />);

    // Should show loading skeleton (form fields not yet rendered)
    expect(screen.queryByLabelText(/first name/i)).not.toBeInTheDocument();

    // Should show loading skeleton animation
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test('should render form fields when services load successfully', async () => {
    mockUseContactForm.mockReturnValue(createMockHookReturn());

    render(<ContactFormInner />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('should show error when services fail to load', async () => {
    mockUseContactForm.mockReturnValue(
      createMockHookReturn({
        formState: {
          isSubmitting: false,
          submitStatus: 'idle' as const,
          isConfigLoading: false,
          serviceConfig: null,
          errorMessage: 'Service failed'
        }
      })
    );

    render(<ContactFormInner />);

    await waitFor(() => {
      expect(screen.getByText(/service failed/i)).toBeInTheDocument();
    });
  });

  test('should render Turnstile widget when enabled', async () => {
    const mockHook = createMockHookReturn({
      formState: {
        isSubmitting: false,
        submitStatus: 'idle' as const,
        errorMessage: '',
        isConfigLoading: false,
        serviceConfig: {
          status: 'healthy',
          services: {
            email: { enabled: true, ready: true },
            turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
          }
        }
      }
    });
    mockUseContactForm.mockReturnValue(mockHook);

    render(<ContactFormInner />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Should call initializeTurnstile when turnstile is enabled
    expect(mockHook.initializeTurnstile).toHaveBeenCalled();

    // When Turnstile is enabled, button shows send message but may be enabled/disabled based on verification state
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });

  test('should render form without Turnstile when disabled', async () => {
    const mockHook = createMockHookReturn({
      formState: {
        isSubmitting: false,
        submitStatus: 'idle' as const,
        errorMessage: '',
        isConfigLoading: false,
        serviceConfig: {
          status: 'healthy',
          services: {
            email: { enabled: true, ready: true },
            turnstile: { enabled: false, ready: false }
          }
        }
      }
    });
    mockUseContactForm.mockReturnValue(mockHook);

    render(<ContactFormInner />);

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled();
  });

  test('should show character count for message field', async () => {
    mockUseContactForm.mockReturnValue(createMockHookReturn());

    render(<ContactFormInner />);

    await waitFor(() => {
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    });

    // Character counter should be visible
    expect(screen.getByText('0/1000')).toBeInTheDocument();
  });

  test('should preserve form data when rate limit error occurs', async () => {
    const user = userEvent.setup();

    // Create mock hook that returns rate limit error on submit
    const mockSubmitForm = vi.fn().mockResolvedValue({
      success: false,
      error: 'Too many requests. Please try again later.'
    });

    mockUseContactForm.mockReturnValue(
      createMockHookReturn({
        submitForm: mockSubmitForm,
        formState: {
          isSubmitting: false,
          submitStatus: 'error' as const,
          errorMessage: 'Too many requests. Please try again later.',
          isConfigLoading: false,
          serviceConfig: {
            status: 'healthy' as const,
            services: {
              email: { enabled: true, ready: true },
              turnstile: { enabled: false, ready: false }
            }
          }
        }
      })
    );

    render(<ContactFormInner />);

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

    // Wait for submission to complete
    await waitFor(() => {
      expect(mockSubmitForm).toHaveBeenCalled();
    });

    // Error message should be displayed
    expect(screen.getByText(/too many requests/i)).toBeInTheDocument();

    // Form data should NOT be cleared when there's a rate limit error
    // Users should not have to re-enter all their information
    expect(firstNameInput).toHaveValue('John');
    expect(lastNameInput).toHaveValue('Doe');
    expect(emailInput).toHaveValue('john.doe@example.com');
    expect(messageInput).toHaveValue(
      'This is a test message that is long enough to meet the minimum character requirement for the contact form.'
    );
  });

  test('should show success message when submission succeeds', async () => {
    mockUseContactForm.mockReturnValue(
      createMockHookReturn({
        formState: {
          isSubmitting: false,
          submitStatus: 'success' as const,
          errorMessage: '',
          isConfigLoading: false,
          serviceConfig: {
            status: 'healthy' as const,
            services: {
              email: { enabled: true, ready: true },
              turnstile: { enabled: false, ready: false }
            }
          }
        }
      })
    );

    render(<ContactFormInner />);

    await waitFor(() => {
      expect(screen.getByText(/message sent/i)).toBeInTheDocument();
    });
  });

  test('should call cleanup on unmount', () => {
    const mockCleanup = vi.fn();
    mockUseContactForm.mockReturnValue(
      createMockHookReturn({
        cleanup: mockCleanup
      })
    );

    const { unmount } = render(<ContactFormInner />);
    unmount();

    expect(mockCleanup).toHaveBeenCalled();
  });
});

import { expect, test, describe, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContactForm } from './useContactForm';
import { ContactFormData } from '../../ContactFormValidator';
import { Result } from '@/shared/Result';
import { ContactFormService } from '../../ContactFormService';
import { SecurityService } from '../../infrastructure/SecurityService';

// Mock the services
vi.mock('../../ContactFormService', () => ({
  ContactFormService: {
    create: vi.fn()
  }
}));

vi.mock('../../infrastructure/SecurityService', () => ({
  SecurityService: vi.fn()
}));

// Mock logger
vi.mock('@/shared/Logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

const mockFormData: ContactFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  message: 'This is a test message that meets the minimum character requirement for testing purposes.'
};

interface MockContactFormService {
  getConfig: ReturnType<typeof vi.fn>;
  submit: ReturnType<typeof vi.fn>;
}

interface MockSecurityService {
  getTokens: ReturnType<typeof vi.fn>;
  initializeTurnstile: ReturnType<typeof vi.fn>;
  cleanup: ReturnType<typeof vi.fn>;
}

describe('useContactForm', () => {
  let mockContactFormService: MockContactFormService;
  let mockSecurityServiceInstance: MockSecurityService;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContactFormService = {
      getConfig: vi.fn(),
      submit: vi.fn()
    };

    mockSecurityServiceInstance = {
      getTokens: vi.fn(),
      initializeTurnstile: vi.fn(),
      cleanup: vi.fn()
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(ContactFormService.create).mockReturnValue(mockContactFormService as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(SecurityService).mockReturnValue(mockSecurityServiceInstance as any);
  });

  test('should initialize with default state', () => {
    const { result } = renderHook(() => useContactForm());

    expect(result.current.formState).toEqual({
      isSubmitting: false,
      submitStatus: 'idle',
      errorMessage: '',
      isConfigLoading: true,
      serviceConfig: null
    });
  });

  test('should initialize config successfully', async () => {
    const mockConfig = {
      status: 'healthy' as const,
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: false, ready: false }
      }
    };

    mockContactFormService.getConfig.mockResolvedValue(Result.success(mockConfig));

    const { result } = renderHook(() => useContactForm());

    await act(async () => {
      await result.current.initializeConfig();
    });

    expect(result.current.formState.isConfigLoading).toBe(false);
    expect(result.current.formState.serviceConfig).toEqual(mockConfig);
    expect(result.current.formState.errorMessage).toBe('');
  });

  test('should handle config initialization failure', async () => {
    mockContactFormService.getConfig.mockResolvedValue(Result.failure('Failed to load config'));

    const { result } = renderHook(() => useContactForm());

    await act(async () => {
      await result.current.initializeConfig();
    });

    expect(result.current.formState.isConfigLoading).toBe(false);
    expect(result.current.formState.serviceConfig).toBeNull();
    expect(result.current.formState.errorMessage).toBe('Failed to load config');
  });

  test('should submit form successfully', async () => {
    const mockConfig = {
      status: 'healthy' as const,
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: false, ready: false }
      }
    };

    mockContactFormService.submit.mockResolvedValue(Result.success());

    const { result } = renderHook(() => useContactForm());

    // Set initial config
    act(() => {
      result.current.formState.serviceConfig = mockConfig;
    });

    let submitResult: { success: boolean; error?: string };
    await act(async () => {
      submitResult = await result.current.submitForm(mockFormData);
    });

    expect(submitResult!.success).toBe(true);
    expect(result.current.formState.submitStatus).toBe('success');
    expect(result.current.formState.isSubmitting).toBe(false);
    expect(mockContactFormService.submit).toHaveBeenCalledWith(mockFormData);
  });

  test('should handle form submission failure', async () => {
    mockContactFormService.submit.mockResolvedValue(Result.failure('Submission failed'));

    const { result } = renderHook(() => useContactForm());

    let submitResult: { success: boolean; error?: string };
    await act(async () => {
      submitResult = await result.current.submitForm(mockFormData);
    });

    expect(submitResult!.success).toBe(false);
    expect(submitResult!.error).toBe('Submission failed');
    expect(result.current.formState.submitStatus).toBe('error');
    expect(result.current.formState.errorMessage).toBe('Submission failed');
    expect(result.current.formState.isSubmitting).toBe(false);
  });

  test('should validate turnstile token when required', async () => {
    const mockConfig = {
      status: 'healthy' as const,
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: true, ready: true, siteKey: 'test-key' }
      }
    };

    mockSecurityServiceInstance.getTokens.mockResolvedValue(
      Result.success({ csrfToken: 'csrf-token' }) // No turnstile token
    );

    const { result } = renderHook(() => useContactForm());

    // Set config with turnstile enabled
    act(() => {
      result.current.formState.serviceConfig = mockConfig;
    });

    let submitResult: { success: boolean; error?: string };
    await act(async () => {
      submitResult = await result.current.submitForm(mockFormData);
    });

    expect(submitResult!.success).toBe(false);
    expect(submitResult!.error).toBe('Please complete the security verification');
    expect(result.current.formState.submitStatus).toBe('error');
    expect(result.current.formState.errorMessage).toBe('Please complete the security verification');
    expect(mockContactFormService.submit).not.toHaveBeenCalled();
  });

  test('should initialize turnstile successfully', async () => {
    const mockConfig = {
      status: 'healthy' as const,
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
      }
    };

    mockSecurityServiceInstance.initializeTurnstile.mockResolvedValue(Result.success());

    const { result } = renderHook(() => useContactForm());

    // Set config first
    act(() => {
      result.current.formState.serviceConfig = mockConfig;
    });

    const container = document.createElement('div');

    await act(async () => {
      await result.current.initializeTurnstile(container);
    });

    expect(mockSecurityServiceInstance.initializeTurnstile).toHaveBeenCalledWith(container, 'test-site-key');
  });

  test('should handle turnstile initialization failure', async () => {
    const mockConfig = {
      status: 'healthy' as const,
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
      }
    };

    mockSecurityServiceInstance.initializeTurnstile.mockResolvedValue(Result.failure('Turnstile failed to load'));

    const { result } = renderHook(() => useContactForm());

    // Set config first
    act(() => {
      result.current.formState.serviceConfig = mockConfig;
    });

    const container = document.createElement('div');

    await act(async () => {
      await result.current.initializeTurnstile(container);
    });

    expect(result.current.formState.submitStatus).toBe('error');
    expect(result.current.formState.errorMessage).toBe('Turnstile failed to load');
  });

  test('should skip turnstile initialization when disabled', async () => {
    const mockConfig = {
      status: 'healthy' as const,
      services: {
        email: { enabled: true, ready: true },
        turnstile: { enabled: false, ready: false }
      }
    };

    const { result } = renderHook(() => useContactForm());

    // Set config first
    act(() => {
      result.current.formState.serviceConfig = mockConfig;
    });

    const container = document.createElement('div');

    await act(async () => {
      await result.current.initializeTurnstile(container);
    });

    expect(mockSecurityServiceInstance.initializeTurnstile).not.toHaveBeenCalled();
  });

  test('should reset submission state', () => {
    const { result } = renderHook(() => useContactForm());

    // Set error state first
    act(() => {
      result.current.formState.submitStatus = 'error';
      result.current.formState.errorMessage = 'Some error';
    });

    act(() => {
      result.current.resetSubmissionState();
    });

    expect(result.current.formState.submitStatus).toBe('idle');
    expect(result.current.formState.errorMessage).toBe('');
  });

  test('should cleanup services', () => {
    const { result } = renderHook(() => useContactForm());

    // The cleanup function should exist and be callable without error
    expect(() => {
      act(() => {
        result.current.cleanup();
      });
    }).not.toThrow();
  });

  test('should use custom baseUrl', () => {
    const customBaseUrl = 'https://custom.example.com';
    const { result } = renderHook(() => useContactForm(customBaseUrl));

    // The hook should initialize without error when given a custom baseUrl
    expect(result.current.formState.isConfigLoading).toBe(true);
    expect(result.current.formState.serviceConfig).toBeNull();
  });
});

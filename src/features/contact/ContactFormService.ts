import { Result } from '@/shared/Result';
import { logger } from '@/shared/Logger';
import { ContactFormData } from './ContactFormValidator';
import { loadTurnstileScript } from './utils/turnstile-loader';

export interface ServiceStatus {
  status: 'healthy' | 'degraded';
  services: {
    email: {
      enabled: boolean;
      ready: boolean;
    };
    turnstile: {
      enabled: boolean;
      ready: boolean;
      siteKey?: string;
    };
  };
}

export interface ContactFormState {
  isLoading: boolean;
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
  serviceStatus: ServiceStatus | null;
}

export class ContactFormService {
  private turnstileToken: string | null = null;
  private csrfToken: string | null = null;
  private serviceStatus: ServiceStatus | null = null;
  private turnstileWidgetId: string | null = null;
  private state: ContactFormState = {
    isLoading: true,
    isSubmitting: false,
    submitStatus: 'idle',
    errorMessage: '',
    serviceStatus: null
  };
  private stateChangeCallback: ((state: ContactFormState) => void) | null = null;

  constructor(private baseUrl: string = '') {}

  // Subscribe to state changes
  onStateChange(callback: (state: ContactFormState) => void): void {
    this.stateChangeCallback = callback;
  }

  private updateState(updates: Partial<ContactFormState>): void {
    this.state = { ...this.state, ...updates };
    this.stateChangeCallback?.(this.state);
  }

  getState(): ContactFormState {
    return this.state;
  }

  async initialize(): Promise<Result<void, string>> {
    try {
      this.updateState({ isLoading: true, errorMessage: '' });

      // Fetch service status and CSRF token concurrently
      const [serviceStatusResult, csrfTokenResult] = await Promise.all([this.checkServerConfig(), this.getCsrfToken()]);

      this.serviceStatus = serviceStatusResult;
      this.csrfToken = csrfTokenResult;

      this.updateState({
        isLoading: false,
        serviceStatus: this.serviceStatus
      });

      return Result.success();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize contact form';
      logger.error('ContactFormService initialization failed:', error);
      this.updateState({
        isLoading: false,
        errorMessage
      });
      return Result.failure(errorMessage);
    }
  }

  private async checkServerConfig(): Promise<ServiceStatus> {
    const response = await fetch(`${this.baseUrl}/api/email-service-check`);
    if (!response.ok) {
      throw new Error('Failed to check server configuration');
    }
    return response.json();
  }

  private async getCsrfToken(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/csrf-token`);
    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }
    const data = await response.json();
    return data.csrfToken;
  }

  async refreshCsrfToken(): Promise<string | null> {
    try {
      const newCsrfToken = await this.getCsrfToken();
      this.csrfToken = newCsrfToken;
      logger.info('CSRF token refreshed successfully');
      return newCsrfToken;
    } catch (error) {
      logger.error('Failed to refresh CSRF token:', error);
      return null;
    }
  }

  async initializeTurnstile(container: HTMLElement): Promise<Result<void, string>> {
    if (!this.serviceStatus?.services.turnstile.enabled || !this.serviceStatus.services.turnstile.siteKey) {
      return Result.success(); // Turnstile not enabled
    }

    try {
      // Load Turnstile script
      await loadTurnstileScript();

      if (!window.turnstile) {
        return Result.failure('Turnstile failed to load');
      }

      // Render Turnstile widget
      this.turnstileWidgetId = window.turnstile.render(container, {
        sitekey: this.serviceStatus.services.turnstile.siteKey,
        theme: 'auto' as const,
        size: 'normal' as const,
        retry: 'never' as const,
        'refresh-timeout': 'manual' as const,
        execution: 'render' as const,
        callback: (token: string) => {
          this.turnstileToken = token;
          this.clearVerificationErrors();
        },
        'error-callback': () => {
          this.updateState({
            submitStatus: 'error',
            errorMessage: 'Verification failed. Please try again.'
          });
          this.turnstileToken = null;
        },
        'expired-callback': () => {
          this.turnstileToken = null;
        },
        'timeout-callback': () => {
          this.updateState({
            submitStatus: 'error',
            errorMessage: 'Verification timed out. Please try again.'
          });
          this.turnstileToken = null;
        }
      });

      return Result.success();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize Turnstile';
      logger.error('Turnstile initialization failed:', error);
      return Result.failure(errorMessage);
    }
  }

  private clearVerificationErrors(): void {
    const verificationErrors = [
      'Please complete the security verification',
      'Invalid security verification. Please complete the challenge again.',
      'Security verification timeout',
      'Security verification service unavailable',
      'Verification failed. Please try again.',
      'Verification timed out. Please try again.'
    ];

    if (verificationErrors.includes(this.state.errorMessage)) {
      this.updateState({
        submitStatus: 'idle',
        errorMessage: ''
      });
    }
  }

  async submitForm(formData: ContactFormData): Promise<Result<void, string>> {
    const turnstileRequired = this.serviceStatus?.services.turnstile.enabled;

    // Validation
    if (turnstileRequired && !this.turnstileToken) {
      this.updateState({
        submitStatus: 'error',
        errorMessage: 'Please complete the security verification'
      });
      return Result.failure('Please complete the security verification');
    }

    if (!this.csrfToken) {
      this.updateState({
        submitStatus: 'error',
        errorMessage: 'A security token is required to send a message'
      });
      return Result.failure('A security token is required to send a message');
    }

    this.updateState({
      isSubmitting: true,
      submitStatus: 'idle',
      errorMessage: ''
    });

    try {
      const result = await this.submitToApi(formData, this.turnstileToken, this.csrfToken);

      if (!result.success) {
        // Handle CSRF token expiration
        if (this.isCsrfError(result.error)) {
          const newCsrfToken = await this.refreshCsrfToken();
          if (newCsrfToken) {
            // Retry with new token
            const retryResult = await this.submitToApi(formData, this.turnstileToken, newCsrfToken);
            if (retryResult.success) {
              this.handleSuccessfulSubmission();
              return Result.success();
            } else {
              this.updateState({
                isSubmitting: false,
                submitStatus: 'error',
                errorMessage: retryResult.error
              });
              return Result.failure(retryResult.error);
            }
          }
        }

        this.updateState({
          isSubmitting: false,
          submitStatus: 'error',
          errorMessage: result.error
        });
        return Result.failure(result.error);
      }

      this.handleSuccessfulSubmission();
      return Result.success();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      logger.error('Contact form submission error:', error);
      this.updateState({
        isSubmitting: false,
        submitStatus: 'error',
        errorMessage
      });
      return Result.failure(errorMessage);
    }
  }

  private async submitToApi(
    formData: ContactFormData,
    turnstileToken: string | null,
    csrfToken: string
  ): Promise<Result<void, string>> {
    const payload = {
      ...formData,
      turnstileToken,
      csrfToken
    };

    const response = await fetch(`${this.baseUrl}/api/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      return Result.success();
    } else {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Request failed with status ${response.status}`;
      return Result.failure(errorMessage);
    }
  }

  private isCsrfError(error: string): boolean {
    return (
      error.includes('403') ||
      error.toLowerCase().includes('forbidden') ||
      error.toLowerCase().includes('csrf') ||
      error.toLowerCase().includes('token')
    );
  }

  private handleSuccessfulSubmission(): void {
    this.updateState({
      isSubmitting: false,
      submitStatus: 'success',
      errorMessage: ''
    });

    // Reset Turnstile token after successful submission
    if (this.serviceStatus?.services.turnstile.enabled) {
      this.turnstileToken = null;
    }
  }

  resetSubmissionState(): void {
    this.updateState({
      submitStatus: 'idle',
      errorMessage: ''
    });
  }

  cleanup(): void {
    if (this.turnstileWidgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.turnstileWidgetId);
      } catch (error) {
        logger.warn('Failed to cleanup Turnstile widget:', error);
      }
    }
    this.turnstileWidgetId = null;
    this.turnstileToken = null;
    this.stateChangeCallback = null;
  }
}

export const defaultContactFormService = new ContactFormService();

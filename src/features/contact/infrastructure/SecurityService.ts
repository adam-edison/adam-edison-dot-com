import { Result } from '@/shared/Result';
import { logger } from '@/shared/Logger';
import { SecurityTokens } from '../types';
import { loadTurnstileScript } from '../utils/turnstile-loader';

export class SecurityService {
  private csrfToken: string | null = null;
  private turnstileToken: string | null = null;
  private turnstileWidgetId: string | null = null;

  constructor(private baseUrl: string = '') {}

  async getTokens(): Promise<Result<SecurityTokens, string>> {
    try {
      if (!this.csrfToken) {
        const csrfResult = await this.getCsrfToken();
        if (!csrfResult.success) {
          return Result.failure(csrfResult.error);
        }
        this.csrfToken = csrfResult.data;
      }

      return Result.success({
        csrfToken: this.csrfToken,
        turnstileToken: this.turnstileToken || undefined
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get security tokens';
      return Result.failure(errorMessage);
    }
  }

  async refreshCsrfToken(): Promise<Result<string, string>> {
    try {
      const result = await this.getCsrfToken();

      if (result.success) {
        this.csrfToken = result.data;
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh CSRF token';
      logger.error('Failed to refresh CSRF token:', error);

      return Result.failure(errorMessage);
    }
  }

  private async getCsrfToken(): Promise<Result<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/csrf-token`);

      if (!response.ok) {
        return Result.failure('Failed to get CSRF token');
      }

      const data = await response.json();

      return Result.success(data.csrfToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error getting CSRF token';

      return Result.failure(errorMessage);
    }
  }

  async initializeTurnstile(container: HTMLElement, siteKey: string): Promise<Result<void, string>> {
    try {
      await loadTurnstileScript();

      if (!window.turnstile) {
        return Result.failure('Turnstile failed to load');
      }

      this.turnstileWidgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: 'auto' as const,
        size: 'normal' as const,
        retry: 'never' as const,
        'refresh-timeout': 'manual' as const,
        execution: 'render' as const,
        callback: (token: string) => {
          this.turnstileToken = token;
        },
        'error-callback': () => {
          this.turnstileToken = null;
        },
        'expired-callback': () => {
          this.turnstileToken = null;
        },
        'timeout-callback': () => {
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

  async resetTokens(): Promise<void> {
    this.turnstileToken = null;
    if (this.turnstileWidgetId && window.turnstile) {
      try {
        window.turnstile.reset(this.turnstileWidgetId);
      } catch (error) {
        logger.warn('Failed to reset Turnstile widget:', error);
      }
    }
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
    this.csrfToken = null;
  }
}

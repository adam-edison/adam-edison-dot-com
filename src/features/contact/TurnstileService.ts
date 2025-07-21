import { Result } from '@/shared/Result';
import { ValidationError, InternalServerError } from '@/shared/errors';
import { logger } from '@/shared/Logger';
import { TurnstileTokenTracker } from './TurnstileTokenTracker';

interface TurnstileVerifyResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
  action?: string;
  cdata?: string;
}

export class TurnstileService {
  private static readonly VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  private static readonly TIMEOUT_MS = 10000; // 10 seconds

  constructor(
    private secretKey: string,
    private tokenTracker: TurnstileTokenTracker
  ) {}

  static fromEnv(): Result<TurnstileService, InternalServerError> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      const error = new InternalServerError('Turnstile configuration error', {
        internalMessage: 'TURNSTILE_SECRET_KEY is not configured'
      });
      return Result.failure(error);
    }

    const tokenTracker = TurnstileTokenTracker.fromEnv();
    return Result.success(new TurnstileService(secretKey, tokenTracker));
  }

  async verifyToken(token: string, remoteIp?: string): Promise<Result<void, ValidationError | InternalServerError>> {
    if (!token) {
      const error = new ValidationError('Security verification required', {
        internalMessage: 'Turnstile token is missing'
      });
      return Result.failure(error);
    }

    // Check for token replay attack
    const tokenTracking = await this.tokenTracker.checkAndMarkTokenUsed(token);
    if (tokenTracking.isUsed) {
      const error = new ValidationError('Security verification has already been used', {
        internalMessage: 'Turnstile token replay attack detected'
      });
      return Result.failure(error);
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TurnstileService.TIMEOUT_MS);

      const response = await fetch(TurnstileService.VERIFY_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.error('Turnstile API error', {
          status: response.status,
          statusText: response.statusText
        });

        const error = new InternalServerError('Security verification service unavailable', {
          internalMessage: `Turnstile API returned ${response.status}: ${response.statusText}`
        });
        return Result.failure(error);
      }

      const data: TurnstileVerifyResponse = await response.json();

      if (!data.success) {
        const errorCodes = (data['error-codes'] as string[]) || [];
        logger.warn('Turnstile verification failed', {
          errorCodes,
          hostname: data.hostname
        });

        // Map error codes to user-friendly messages
        let userMessage = 'Security verification failed. Please try again.';
        let internalMessage = `Turnstile verification failed: ${errorCodes.join(', ')}`;

        // Handle specific error codes
        if (errorCodes.includes('timeout-or-duplicate')) {
          userMessage = 'Security verification expired. Please refresh and try again.';
        } else if (errorCodes.includes('invalid-input-response')) {
          userMessage = 'Invalid security verification. Please complete the challenge again.';
        } else if (errorCodes.includes('bad-request')) {
          internalMessage = 'Bad request to Turnstile API';
        } else if (errorCodes.includes('invalid-input-secret')) {
          internalMessage = 'Invalid Turnstile secret key';
          // This is a server configuration error
          const error = new InternalServerError('Security verification configuration error', {
            internalMessage
          });
          return Result.failure(error);
        }

        const error = new ValidationError(userMessage, {
          internalMessage,
          details: errorCodes
        });
        return Result.failure(error);
      }

      // Verification successful
      logger.info('Turnstile verification successful', {
        hostname: data.hostname,
        challengeTs: data.challenge_ts
      });

      return Result.success();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('Turnstile verification timeout');
        const timeoutError = new InternalServerError('Security verification timeout', {
          internalMessage: 'Turnstile API request timed out'
        });
        return Result.failure(timeoutError);
      }

      logger.error('Turnstile verification error', error);
      const serverError = new InternalServerError('Security verification error', {
        internalMessage: error instanceof Error ? error.message : 'Unknown error during Turnstile verification'
      });
      return Result.failure(serverError);
    }
  }

  /**
   * Check if Turnstile is enabled by checking if the secret key is configured
   */
  static isEnabled(): boolean {
    return !!process.env.TURNSTILE_SECRET_KEY;
  }
}

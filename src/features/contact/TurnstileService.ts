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
  private static readonly TIMEOUT_MS = parseInt(process.env.TURNSTILE_TIMEOUT_MS || '10000', 10);

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
    // Validate token input
    const tokenValidation = this.validateTokenInput(token);
    if (!tokenValidation.success) {
      return tokenValidation;
    }

    // Check for token replay attack
    const replayCheck = await this.checkTokenReplay(token);
    if (!replayCheck.success) {
      return replayCheck;
    }

    // Call Turnstile API
    const apiResult = await this.callTurnstileApi(token, remoteIp);
    if (!apiResult.success) {
      return apiResult;
    }

    // Parse and validate response
    const responseValidation = this.validateTurnstileResponse(apiResult.data);
    if (!responseValidation.success) {
      return responseValidation;
    }

    // Log successful verification
    logger.info('Turnstile verification successful', {
      hostname: responseValidation.data.hostname,
      challengeTs: responseValidation.data.challenge_ts
    });

    return Result.success();
  }

  private validateTokenInput(token: string): Result<void, ValidationError> {
    if (!token) {
      const error = new ValidationError('Security verification required', {
        internalMessage: 'Turnstile token is missing'
      });
      return Result.failure(error);
    }
    return Result.success();
  }

  private async checkTokenReplay(token: string): Promise<Result<void, ValidationError>> {
    const tokenTracking = await this.tokenTracker.checkAndMarkTokenUsed(token);
    if (tokenTracking.isUsed) {
      const error = new ValidationError('Security verification has already been used', {
        internalMessage: 'Turnstile token replay attack detected'
      });
      return Result.failure(error);
    }
    return Result.success();
  }

  private async callTurnstileApi(
    token: string,
    remoteIp?: string
  ): Promise<Result<TurnstileVerifyResponse, InternalServerError>> {
    try {
      const formData = this.createRequestFormData(token, remoteIp);
      const response = await this.makeApiRequest(formData);

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
      return Result.success(data);
    } catch (error) {
      return this.handleApiError(error);
    }
  }

  private createRequestFormData(token: string, remoteIp?: string): URLSearchParams {
    const formData = new URLSearchParams();
    formData.append('secret', this.secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }
    return formData;
  }

  private async makeApiRequest(formData: URLSearchParams): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TurnstileService.TIMEOUT_MS);

    try {
      const response = await fetch(TurnstileService.VERIFY_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private handleApiError(error: unknown): Result<TurnstileVerifyResponse, InternalServerError> {
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

  private validateTurnstileResponse(
    data: TurnstileVerifyResponse
  ): Result<TurnstileVerifyResponse, ValidationError | InternalServerError> {
    if (!data.success) {
      const errorCodes = (data['error-codes'] as string[]) || [];
      logger.warn('Turnstile verification failed', {
        errorCodes,
        hostname: data.hostname
      });

      const errorMapping = this.mapTurnstileErrors(errorCodes);
      if (errorMapping.isServerError) {
        const error = new InternalServerError(errorMapping.userMessage, {
          internalMessage: errorMapping.internalMessage
        });
        return Result.failure(error);
      }

      const error = new ValidationError(errorMapping.userMessage, {
        internalMessage: errorMapping.internalMessage,
        details: errorCodes
      });
      return Result.failure(error);
    }

    return Result.success(data);
  }

  private mapTurnstileErrors(errorCodes: string[]): {
    userMessage: string;
    internalMessage: string;
    isServerError: boolean;
  } {
    let userMessage = 'Security verification failed. Please try again.';
    let internalMessage = `Turnstile verification failed: ${errorCodes.join(', ')}`;
    let isServerError = false;

    if (errorCodes.includes('timeout-or-duplicate')) {
      userMessage = 'Security verification expired. Please refresh and try again.';
    } else if (errorCodes.includes('invalid-input-response')) {
      userMessage = 'Invalid security verification. Please complete the challenge again.';
    } else if (errorCodes.includes('bad-request')) {
      internalMessage = 'Bad request to Turnstile API';
    } else if (errorCodes.includes('invalid-input-secret')) {
      userMessage = 'Security verification configuration error';
      internalMessage = 'Invalid Turnstile secret key';
      isServerError = true;
    }

    return { userMessage, internalMessage, isServerError };
  }

  /**
   * Check if Turnstile is enabled by checking if the secret key is configured
   */
  static isEnabled(): boolean {
    return !!process.env.TURNSTILE_SECRET_KEY;
  }
}

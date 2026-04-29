import { logger } from '@/shared/Logger';
import { Result } from '@/shared/Result';
import { ServiceUnavailableError, TurnstileError } from '@/shared/errors';

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export class TurnstileClient {
  private constructor(private readonly secretKey: string) {}

  static fromEnv(env: NodeJS.ProcessEnv = process.env): Result<TurnstileClient, ServiceUnavailableError> {
    const secretKey = env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      const clientMessage = 'Captcha verification is not available. Please try again later.';
      const internalMessage = 'TURNSTILE_SECRET_KEY is not configured';
      const configError = new ServiceUnavailableError(clientMessage, {
        internalMessage,
        serviceName: 'Cloudflare Turnstile'
      });
      return Result.failure(configError);
    }

    return Result.success(new TurnstileClient(secretKey));
  }

  async verifyToken(token: string, remoteIp?: string): Promise<Result<void, TurnstileError>> {
    if (!token || token.trim() === '') {
      return this.failClosed('Turnstile token is missing or empty', undefined);
    }

    const verifyResult = await this.callTurnstileApi(token, remoteIp);
    if (!verifyResult.success) {
      return this.failClosed(`Turnstile verification request failed: ${verifyResult.error.message}`, undefined);
    }

    if (!verifyResult.data.success) {
      const errorCodes = verifyResult.data['error-codes'];
      const codes = errorCodes?.join(', ') || 'unknown';
      return this.failClosed(`Turnstile verification rejected: ${codes}`, errorCodes);
    }

    return Result.success();
  }

  private async callTurnstileApi(token: string, remoteIp?: string): Promise<Result<TurnstileVerifyResponse, Error>> {
    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) formData.append('remoteip', remoteIp);

      const response = await fetch(TURNSTILE_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });

      if (!response.ok) {
        return Result.failure(new Error(`Turnstile API returned status ${response.status}`));
      }

      const data = (await response.json()) as TurnstileVerifyResponse;
      return Result.success(data);
    } catch (error) {
      const wrapped = error instanceof Error ? error : new Error(String(error));
      return Result.failure(wrapped);
    }
  }

  private failClosed(internalMessage: string, errorCodes: string[] | undefined): Result<void, TurnstileError> {
    logger.warn(`Turnstile verification failed (fail-closed): ${internalMessage}`);
    const clientMessage = 'Captcha verification failed. Please try again.';
    const turnstileError = new TurnstileError(clientMessage, { internalMessage, errorCodes });
    return Result.failure(turnstileError);
  }
}

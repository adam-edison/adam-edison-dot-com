import { logger } from '@/shared/Logger';
import { Result } from '@/shared/Result';
import { RecaptchaError, ServiceUnavailableError } from '@/shared/errors';

export interface RecaptchaAPIResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface RecaptchaConfiguration {
  secretKey: string | undefined;
  scoreThreshold: number;
  verificationEnabled: boolean;
}

export class RecaptchaService {
  private readonly config: RecaptchaConfiguration;

  private constructor(config: RecaptchaConfiguration) {
    this.config = config;
  }

  static fromEnv(): RecaptchaService {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD!);
    const verificationEnabled = scoreThreshold !== 0;

    const config: RecaptchaConfiguration = {
      secretKey,
      scoreThreshold,
      verificationEnabled
    };

    return new RecaptchaService(config);
  }

  async verifyToken(token: string): Promise<Result<boolean, RecaptchaError | ServiceUnavailableError>> {
    if (!this.config.verificationEnabled) {
      return Result.success(true);
    }

    if (this.isTokenEmpty(token)) {
      logger.warn('No reCAPTCHA token provided - allowing request (fail-open)');
      return Result.success(true);
    }

    if (this.isSecretKeyMissing()) {
      logger.error('reCAPTCHA secret key not configured - allowing request (fail-open)');
      return Result.success(true);
    }

    try {
      const verificationResult = await this.callRecaptchaAPI(token);
      return this.processVerificationResult(verificationResult);
    } catch (error) {
      return this.handleVerificationError(error);
    }
  }

  private isTokenEmpty(token: string): boolean {
    return !token || token.trim() === '';
  }

  private isSecretKeyMissing(): boolean {
    return !this.config.secretKey;
  }

  private async callRecaptchaAPI(token: string): Promise<RecaptchaAPIResponse> {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${this.config.secretKey}&response=${token}`
    });

    return response.json();
  }

  private processVerificationResult(data: RecaptchaAPIResponse): Result<boolean, RecaptchaError> {
    if (!data.success) {
      logger.error('reCAPTCHA verification failed:', data['error-codes'], '- allowing request (fail-open)');
      return Result.success(true);
    }

    if (this.isScoreBelowThreshold(data.score)) {
      logger.error('reCAPTCHA score too low:', data.score, '- allowing request (fail-open)');
      return Result.success(true);
    }

    return Result.success(true);
  }

  private isScoreBelowThreshold(score: number | undefined): boolean {
    return Boolean(score && score < this.config.scoreThreshold);
  }

  private handleVerificationError(error: unknown): Result<boolean, ServiceUnavailableError> {
    logger.error('Error verifying reCAPTCHA:', error, '- allowing request (fail-open)');
    return Result.success(true);
  }
}

export const recaptchaService = RecaptchaService.fromEnv();

import { BaseError } from './BaseError';

export interface RecaptchaErrorOptions {
  internalMessage: string;
  score?: number;
}

export class RecaptchaError extends BaseError {
  readonly code = 'RECAPTCHA_ERROR';
  readonly category = 'client' as const;
  readonly httpStatusCode = 400;

  public readonly score?: number;

  constructor(message: string, options: RecaptchaErrorOptions) {
    const { internalMessage, score } = options;
    super(message, { internalMessage });
    this.score = score;
  }
}

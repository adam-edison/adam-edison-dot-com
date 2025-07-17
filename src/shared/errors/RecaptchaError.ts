import { BaseError } from './BaseError';

export class RecaptchaError extends BaseError {
  readonly code = 'RECAPTCHA_ERROR';
  readonly category = 'client' as const;

  constructor(
    message: string,
    internalMessage?: string,
    public readonly score?: number
  ) {
    super(message, internalMessage);
  }
}

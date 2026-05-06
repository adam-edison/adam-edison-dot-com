import { BaseError } from './BaseError';

export interface TurnstileErrorOptions {
  internalMessage: string;
  errorCodes?: string[];
}

export class TurnstileError extends BaseError {
  readonly code = 'TURNSTILE_ERROR';
  readonly category = 'client' as const;
  readonly httpStatusCode = 400;

  public readonly errorCodes?: string[];

  constructor(message: string, options: TurnstileErrorOptions) {
    const { internalMessage, errorCodes } = options;
    super(message, { internalMessage });
    this.errorCodes = errorCodes;
  }
}

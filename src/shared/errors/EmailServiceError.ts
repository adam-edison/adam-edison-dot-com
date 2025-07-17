import { BaseError } from './BaseError';

export interface EmailServiceErrorOptions {
  internalMessage: string;
  isConfigError?: boolean;
}

export class EmailServiceError extends BaseError {
  readonly code = 'EMAIL_SERVICE_ERROR';
  readonly category = 'server' as const;
  readonly httpStatusCode: number;

  public readonly isConfigError: boolean;

  constructor(message: string, options: EmailServiceErrorOptions) {
    const { internalMessage, isConfigError = false } = options;
    super(message, { internalMessage });
    this.isConfigError = isConfigError;
    this.httpStatusCode = isConfigError ? 500 : 502;
  }
}

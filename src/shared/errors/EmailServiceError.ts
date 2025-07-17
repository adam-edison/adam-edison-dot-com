import { BaseError } from './BaseError';

export class EmailServiceError extends BaseError {
  readonly code = 'EMAIL_SERVICE_ERROR';
  readonly category = 'server' as const;

  constructor(
    message: string,
    internalMessage?: string,
    public readonly isConfigError: boolean = false
  ) {
    super(message, internalMessage);
  }
}

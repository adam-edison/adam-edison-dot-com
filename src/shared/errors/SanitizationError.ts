import { BaseError } from './BaseError';

export interface SanitizationErrorOptions {
  internalMessage: string;
  details?: unknown[];
}

export class SanitizationError extends BaseError {
  readonly code = 'SANITIZATION_ERROR';
  readonly category = 'client' as const;
  readonly httpStatusCode = 400;

  constructor(message: string, options: SanitizationErrorOptions) {
    const { internalMessage, details } = options;
    super(message, { internalMessage, details });
  }
}

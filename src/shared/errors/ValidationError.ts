import { BaseError } from './BaseError';

export interface ValidationErrorOptions {
  internalMessage: string;
  details?: unknown[];
  field?: string;
}

export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'client' as const;
  readonly httpStatusCode = 400;

  public readonly field?: string;

  constructor(message: string, options: ValidationErrorOptions) {
    const { internalMessage, details, field } = options;
    const responseMetadata = details ? { errors: details } : undefined;
    super(message, { internalMessage, details, responseMetadata });
    this.field = field;
  }
}

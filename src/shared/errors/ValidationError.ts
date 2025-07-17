import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'client' as const;

  constructor(
    message: string,
    internalMessage?: string,
    details?: unknown[],
    public readonly field?: string
  ) {
    super(message, internalMessage, details);
  }
}

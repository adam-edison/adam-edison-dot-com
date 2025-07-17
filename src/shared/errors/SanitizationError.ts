import { BaseError } from './BaseError';

export class SanitizationError extends BaseError {
  readonly code = 'SANITIZATION_ERROR';
  readonly category = 'client' as const;

  constructor(message: string, internalMessage?: string, details?: unknown[]) {
    super(message, internalMessage, details);
  }
}

import { BaseError } from './BaseError';

export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly category = 'client' as const;

  constructor(
    message: string,
    internalMessage?: string,
    public readonly retryAfter?: number
  ) {
    super(message, internalMessage);
  }
}

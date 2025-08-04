import { BaseError } from './BaseError';

export interface RateLimitErrorOptions {
  internalMessage: string;
  retryAfter: number;
  limitType: 'ip' | 'global' | 'email';
}

export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly category = 'client' as const;
  readonly httpStatusCode = 429;

  constructor(message: string, options: RateLimitErrorOptions) {
    const { internalMessage, retryAfter, limitType } = options;
    const responseMetadata = { retryAfter };
    const metadata = { limitType, actualLimitValue: retryAfter };
    super(message, { internalMessage, responseMetadata, metadata });
  }
}

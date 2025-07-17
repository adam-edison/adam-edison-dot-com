import { BaseError } from './BaseError';

export interface MethodNotAllowedErrorOptions {
  internalMessage: string;
  allowedMethod: string;
  attemptedMethod: string;
}

export class MethodNotAllowedError extends BaseError {
  readonly code = 'METHOD_NOT_ALLOWED';
  readonly category = 'client' as const;
  readonly httpStatusCode = 405;

  constructor(message: string, options: MethodNotAllowedErrorOptions) {
    const { internalMessage, allowedMethod, attemptedMethod } = options;
    const metadata = { allowedMethod, attemptedMethod };
    const headers = { Allow: allowedMethod };
    super(message, { internalMessage, metadata, headers });
  }
}

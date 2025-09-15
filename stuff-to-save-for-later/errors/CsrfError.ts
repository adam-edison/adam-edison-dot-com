import { BaseError, BaseErrorOptions } from './BaseError';

export class CsrfError extends BaseError {
  readonly code = 'CSRF_ERROR';
  readonly category = 'client' as const;
  readonly httpStatusCode = 403;

  constructor(message = 'Invalid security token.', options: BaseErrorOptions = {}) {
    super(message, options);
  }
}

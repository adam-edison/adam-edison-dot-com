import { BaseError, BaseErrorOptions } from './BaseError';

export class InternalServerError extends BaseError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly category = 'server' as const;
  readonly httpStatusCode = 500;

  constructor(message: string, options: BaseErrorOptions) {
    const { internalMessage } = options;
    super(message, { internalMessage });
  }
}

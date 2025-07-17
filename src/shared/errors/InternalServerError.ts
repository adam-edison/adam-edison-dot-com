import { BaseError } from './BaseError';

export interface InternalServerErrorOptions {
  internalMessage: string;
}

export class InternalServerError extends BaseError {
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly category = 'server' as const;
  readonly httpStatusCode = 500;

  constructor(message: string, options: InternalServerErrorOptions) {
    const { internalMessage } = options;
    super(message, { internalMessage });
  }
}

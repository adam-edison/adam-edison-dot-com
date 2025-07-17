import { BaseError } from './BaseError';

export interface ServiceUnavailableErrorOptions {
  internalMessage: string;
  serviceName?: string;
}

export class ServiceUnavailableError extends BaseError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly category = 'external' as const;
  readonly httpStatusCode = 503;

  public readonly serviceName?: string;

  constructor(message: string, options: ServiceUnavailableErrorOptions) {
    const { internalMessage, serviceName } = options;
    super(message, { internalMessage });
    this.serviceName = serviceName;
  }
}

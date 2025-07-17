import { BaseError } from './BaseError';

export class ServiceUnavailableError extends BaseError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly category = 'external' as const;

  constructor(
    message: string,
    internalMessage?: string,
    public readonly serviceName?: string
  ) {
    super(message, internalMessage);
  }
}

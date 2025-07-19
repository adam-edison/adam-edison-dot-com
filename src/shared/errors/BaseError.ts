export interface BaseErrorOptions {
  internalMessage?: string;
  details?: unknown[];
  responseMetadata?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  headers?: Record<string, string | number>;
}

export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'client' | 'server' | 'external';
  abstract readonly httpStatusCode: number;

  public readonly internalMessage: string;
  public readonly details?: unknown[];
  public readonly responseMetadata?: Record<string, unknown>;
  public readonly metadata?: Record<string, unknown>;
  public readonly headers?: Record<string, string | number>;

  constructor(message: string, options: BaseErrorOptions = {}) {
    super(message);
    const { internalMessage, details, responseMetadata, metadata, headers } = options;
    this.internalMessage = internalMessage || message;
    this.details = details;
    this.responseMetadata = responseMetadata;
    this.metadata = metadata;
    this.headers = headers;
    this.name = this.constructor.name;
  }
}

export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'client' | 'server' | 'external';

  constructor(
    message: string,
    public readonly internalMessage?: string,
    public readonly details?: unknown[]
  ) {
    super(message);
    this.internalMessage = internalMessage || message;
    this.name = this.constructor.name;
  }
}

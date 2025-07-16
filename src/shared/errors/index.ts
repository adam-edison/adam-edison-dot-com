export abstract class BaseError extends Error {
  abstract readonly code: string;
  abstract readonly category: 'client' | 'server' | 'external';

  constructor(
    message: string,
    public readonly details?: unknown[]
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends BaseError {
  readonly code = 'VALIDATION_ERROR';
  readonly category = 'client' as const;

  constructor(
    message: string,
    details?: unknown[],
    public readonly field?: string
  ) {
    super(message, details);
  }
}

export class RecaptchaError extends BaseError {
  readonly code = 'RECAPTCHA_ERROR';
  readonly category = 'client' as const;

  constructor(
    message: string,
    public readonly score?: number
  ) {
    super(message);
  }
}

export class SanitizationError extends BaseError {
  readonly code = 'SANITIZATION_ERROR';
  readonly category = 'client' as const;

  constructor(message: string, details?: unknown[]) {
    super(message, details);
  }
}

export class EmailServiceError extends BaseError {
  readonly code = 'EMAIL_SERVICE_ERROR';
  readonly category = 'server' as const;

  constructor(
    message: string,
    public readonly isConfigError: boolean = false
  ) {
    super(message);
  }
}

export class RateLimitError extends BaseError {
  readonly code = 'RATE_LIMIT_ERROR';
  readonly category = 'client' as const;

  constructor(
    message: string,
    public readonly retryAfter?: number
  ) {
    super(message);
  }
}

export class ServiceUnavailableError extends BaseError {
  readonly code = 'SERVICE_UNAVAILABLE';
  readonly category = 'external' as const;

  constructor(
    message: string,
    public readonly serviceName: string
  ) {
    super(message);
  }
}

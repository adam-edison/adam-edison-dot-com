import type { NextApiResponse } from 'next';
import { logger } from './Logger';
import {
  BaseError,
  ValidationError,
  RecaptchaError,
  SanitizationError,
  EmailServiceError,
  ServiceUnavailableError
} from './errors';

export interface ErrorResponse {
  statusCode: number;
  response: {
    message: string;
    errors?: unknown[];
  };
}

export class ApiErrorHandler {
  static mapErrorToResponse(error: BaseError): ErrorResponse {
    const statusCode = this.getStatusCode(error);
    const response = this.buildResponse(error);

    return { statusCode, response };
  }

  static handle(res: NextApiResponse, error: BaseError): void {
    const { statusCode, response } = this.mapErrorToResponse(error);

    // Log internal message for backend debugging
    logger.error('API Error:', {
      code: error.code,
      category: error.category,
      clientMessage: error.message,
      internalMessage: error.internalMessage,
      statusCode,
      details: error.details
    });

    res.status(statusCode).json(response);
  }

  private static getStatusCode(error: BaseError): number {
    if (error instanceof ValidationError || error instanceof RecaptchaError || error instanceof SanitizationError) {
      return 400;
    }

    if (error instanceof EmailServiceError) {
      return error.isConfigError ? 500 : 502;
    }

    if (error instanceof ServiceUnavailableError) {
      return 503;
    }

    return 500;
  }

  private static buildResponse(error: BaseError): { message: string; errors?: unknown[] } {
    const response: { message: string; errors?: unknown[] } = {
      message: error.message
    };

    if (error instanceof ValidationError || error instanceof SanitizationError) {
      response.errors = error.details;
    }

    return response;
  }
}

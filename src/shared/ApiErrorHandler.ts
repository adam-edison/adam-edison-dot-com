import type { NextApiResponse } from 'next';
import { logger } from './Logger';
import { BaseError, ValidationError, SanitizationError } from './errors';

export interface ErrorResponse {
  statusCode: number;
  response: {
    message: string;
    [key: string]: unknown;
  };
}

export class ApiErrorHandler {
  static mapErrorToResponse(error: BaseError): ErrorResponse {
    const statusCode = error.httpStatusCode;
    const response = this.buildResponse(error);

    return { statusCode, response };
  }

  static handle(res: NextApiResponse, error: BaseError): void {
    const { statusCode, response } = this.mapErrorToResponse(error);

    // Set any custom headers
    if (error.headers) {
      Object.entries(error.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Log internal message for backend debugging
    logger.error('API Error:', {
      code: error.code,
      category: error.category,
      clientMessage: error.message,
      internalMessage: error.internalMessage,
      statusCode,
      details: error.details,
      metadata: error.metadata
    });

    res.status(statusCode).json(response);
  }

  private static buildResponse(error: BaseError): { message: string; [key: string]: unknown } {
    const response: { message: string; [key: string]: unknown } = {
      message: error.message
    };

    // Add details for validation/sanitization errors
    if (error instanceof ValidationError || error instanceof SanitizationError) {
      response.errors = error.details;
    }

    if (error.responseMetadata) {
      Object.assign(response, error.responseMetadata);
    }

    return response;
  }
}

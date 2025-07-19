import type { NextApiResponse } from 'next';
import { logger } from './Logger';
import { BaseError } from './errors';
import { RequestContext } from './RequestContext';

export interface ErrorResponse {
  statusCode: number;
  response: {
    message: string;
    [key: string]: unknown;
  };
}

export class ApiErrorHandler {
  static handle(res: NextApiResponse, error: BaseError, context?: RequestContext): ErrorResponse {
    const statusCode = error.httpStatusCode;
    const response = this.buildResponse(error);

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
      metadata: error.metadata,
      requestContext: context
    });

    res.status(statusCode).json(response);

    return { statusCode, response };
  }

  private static buildResponse(error: BaseError): { message: string; [key: string]: unknown } {
    const response: { message: string; [key: string]: unknown } = {
      message: error.message
    };

    if (error.responseMetadata) {
      Object.assign(response, error.responseMetadata);
    }

    return response;
  }
}

import type { NextApiResponse } from 'next';
import { BaseError } from './errors';

export interface ErrorResponse {
  statusCode: number;
  response: {
    message: string;
    [key: string]: unknown;
  };
}

interface ErrorHandlerOptions {
  error: BaseError;
  context?: Record<string, unknown>;
}

export class ApiErrorHandler {
  static async handle(res: NextApiResponse, options: ErrorHandlerOptions): Promise<ErrorResponse> {
    const { error, context } = options;
    const statusCode = error.httpStatusCode;
    const response = this.buildResponse(error);

    // Set any custom headers
    if (error.headers) {
      Object.entries(error.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Log internal message for backend debugging
    console.error('API Error:', {
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

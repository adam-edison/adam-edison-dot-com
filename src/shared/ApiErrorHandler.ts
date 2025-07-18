import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from './Logger';
import { BaseError } from './errors';

export interface RequestContext {
  requestId: string;
  ip?: string;
  userAgent?: string;
}

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

  static handle(res: NextApiResponse, error: BaseError, context?: RequestContext): void {
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
      metadata: error.metadata,
      requestContext: context
    });

    res.status(statusCode).json(response);
  }

  static createRequestContext(req: NextApiRequest): RequestContext {
    const requestId = crypto.randomUUID();
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return {
      requestId,
      ip: Array.isArray(ip) ? ip[0] : ip,
      userAgent
    };
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

import type { NextApiRequest } from 'next';
import { Result } from './Result';
import { MethodNotAllowedError } from './errors';

export class RequestValidator {
  static extractClientIp(req: NextApiRequest): string {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return Array.isArray(clientIP) ? clientIP[0] : clientIP;
  }

  static validateMethod(req: NextApiRequest, allowedMethod: string): Result<void, MethodNotAllowedError> {
    if (req.method === allowedMethod) {
      return Result.success();
    }

    const methodError = new MethodNotAllowedError('Method not allowed', {
      internalMessage: `Invalid method ${req.method}, expected ${allowedMethod}`,
      allowedMethod,
      attemptedMethod: req.method || 'unknown'
    });
    return Result.failure(methodError);
  }
}

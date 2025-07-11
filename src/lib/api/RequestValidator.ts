import type { NextApiRequest } from 'next';

export class RequestValidator {
  static extractClientIp(req: NextApiRequest): string {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    return Array.isArray(clientIP) ? clientIP[0] : clientIP;
  }

  static validateMethod(req: NextApiRequest, allowedMethod: string): boolean {
    return req.method === allowedMethod;
  }
}

import type { NextApiRequest } from 'next';

export class RequestContext {
  constructor(
    public readonly requestId: string,
    public readonly ip?: string,
    public readonly userAgent?: string
  ) {}

  static from(req: NextApiRequest): RequestContext {
    const requestId = crypto.randomUUID();
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return new RequestContext(requestId, Array.isArray(ip) ? ip[0] : ip, userAgent);
  }
}

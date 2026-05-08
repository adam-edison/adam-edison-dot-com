import { ContactRateLimiter } from '@/features/contact/ContactRateLimiter';
import { RequestValidator } from '@/shared/RequestValidator';
import { ContactFormProcessor } from '@/features/contact/ContactFormProcessor';
import { ApiErrorHandler } from '@/shared/ApiErrorHandler';
import { RequestContext } from '@/shared/RequestContext';
import type { NextApiRequest, NextApiResponse } from 'next';

function setRateLimitHeaders(res: NextApiResponse, headers: Record<string, string | number>) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestContext = RequestContext.from(req);

  const methodValidation = RequestValidator.validateMethod(req, 'POST');
  if (!methodValidation.success) return ApiErrorHandler.handle(res, methodValidation.error, requestContext);

  // Derive client IP from request headers/socket — never from the JSON body — so a submitter cannot spoof it
  // to bypass per-IP rate limiting or to forge the `remoteip` field forwarded to Cloudflare Turnstile.
  const ip = RequestValidator.extractClientIp(req);

  const rateLimitResult = await ContactRateLimiter.fromEnv().checkLimits(ip);
  if (!rateLimitResult.success) return ApiErrorHandler.handle(res, rateLimitResult.error, requestContext);

  setRateLimitHeaders(res, rateLimitResult.data.headers);

  const processor = ContactFormProcessor.fromEnv();

  const formResult = await processor.processForm(req.body, { remoteIp: ip });
  if (!formResult.success) return ApiErrorHandler.handle(res, formResult.error, requestContext);

  res.status(200).json({ message: 'Message sent successfully' });
}

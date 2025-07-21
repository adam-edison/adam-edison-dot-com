import { ContactRateLimiter } from '@/features/contact/ContactRateLimiter';
import { RequestValidator } from '@/shared/RequestValidator';
import { ContactFormProcessor } from '@/features/contact/ContactFormProcessor';
import { ApiErrorHandler } from '@/shared/ApiErrorHandler';
import { RequestContext } from '@/shared/RequestContext';
import type { NextApiRequest, NextApiResponse } from 'next';
import { ResponseTimeProtector } from '@/shared/ResponseTimeProtector';
import { ApiSuccessHandler } from '@/shared/ApiSuccessHandler';

function setRateLimitHeaders(res: NextApiResponse, headers: Record<string, string | number>) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestContext = RequestContext.from(req);
  const timeProtector = new ResponseTimeProtector();

  const methodValidation = RequestValidator.validateMethod(req, 'POST');
  if (!methodValidation.success) {
    return ApiErrorHandler.handle(res, {
      error: methodValidation.error,
      timeProtector,
      context: requestContext
    });
  }

  const ip = RequestValidator.extractClientIp(req);

  const rateLimitResult = await ContactRateLimiter.fromEnv().checkLimits(ip);
  if (!rateLimitResult.success) {
    return ApiErrorHandler.handle(res, {
      error: rateLimitResult.error,
      timeProtector,
      context: requestContext
    });
  }

  setRateLimitHeaders(res, rateLimitResult.data.headers);

  const processorResult = await ContactFormProcessor.fromEnv();
  if (!processorResult.success) {
    return ApiErrorHandler.handle(res, {
      error: processorResult.error,
      timeProtector,
      context: requestContext
    });
  }

  const formResult = await processorResult.data.processForm(req.body, ip);
  if (!formResult.success) {
    return ApiErrorHandler.handle(res, {
      error: formResult.error,
      timeProtector,
      context: requestContext
    });
  }

  return ApiSuccessHandler.handle(res, {
    statusCode: 200,
    data: { message: 'Message sent successfully' },
    timeProtector
  });
}

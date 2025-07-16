import { contactRateLimiter } from '@/features/contact/ContactRateLimiter';
import { RequestValidator } from '@/shared/RequestValidator';
import { ContactFormProcessor } from '@/features/contact/ContactFormProcessor';
import { logger } from '@/shared/Logger';
import { ValidationError, RecaptchaError, SanitizationError, EmailServiceError } from '@/shared/errors';
import type { NextApiRequest, NextApiResponse } from 'next';

function setRateLimitHeaders(res: NextApiResponse, headers: Record<string, string | number>) {
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!RequestValidator.validateMethod(req, 'POST')) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const ip = RequestValidator.extractClientIp(req);

    const rateLimitResult = await contactRateLimiter.checkLimits(ip);

    setRateLimitHeaders(res, rateLimitResult.globalResult.headers);
    setRateLimitHeaders(res, rateLimitResult.ipResult.headers);

    if (rateLimitResult.globalLimitExceeded) {
      return res.status(429).json({
        message: 'Site-wide rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.globalResult.reset - Date.now()) / 1000)
      });
    }

    if (rateLimitResult.ipLimitExceeded) {
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((rateLimitResult.ipResult.reset - Date.now()) / 1000)
      });
    }

    const result = await ContactFormProcessor.processForm(req.body);

    if (!result.success) {
      const error = result.error;

      let statusCode = 500;
      if (error instanceof ValidationError || error instanceof RecaptchaError || error instanceof SanitizationError) {
        statusCode = 400;
      } else if (error instanceof EmailServiceError && error.isConfigError) {
        statusCode = 500;
      } else if (error instanceof EmailServiceError) {
        statusCode = 502;
      }

      const response: { message: string; errors?: unknown[] } = {
        message: error.message
      };

      if (error instanceof ValidationError || error instanceof SanitizationError) {
        response.errors = error.details;
      }

      return res.status(statusCode).json(response);
    }

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    logger.error('Contact form handler error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
}

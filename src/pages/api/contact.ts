import { ContactRateLimiter } from '@/features/contact/ContactRateLimiter';
import { RequestValidator } from '@/shared/RequestValidator';
import { ContactFormProcessor } from '@/features/contact/ContactFormProcessor';
import { logger } from '@/shared/Logger';
import { ErrorResponseMapper } from '@/shared/ErrorResponseMapper';
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

    const contactRateLimiter = ContactRateLimiter.fromEnv();
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

    const processorResult = await ContactFormProcessor.fromEnv();
    if (!processorResult.success) {
      logger.error('Failed to create ContactFormProcessor:', processorResult.error);
      return res.status(500).json({ message: 'Internal server error' });
    }

    const result = await processorResult.data.processForm(req.body);

    if (!result.success) {
      return ErrorResponseMapper.sendErrorResponse(res, result.error);
    }

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    logger.error('Contact form handler error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
}

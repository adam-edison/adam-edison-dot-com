import { contactRateLimiter } from '@/lib/api/ContactRateLimiter';
import { RequestValidator } from '@/lib/api/RequestValidator';
import { ContactFormProcessor } from '@/lib/api/ContactFormProcessor';
import { logger } from '@/lib/logger/Logger';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (!RequestValidator.validateMethod(req, 'POST')) {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get client IP for rate limiting
    const ip = RequestValidator.extractClientIp(req);

    // Apply rate limiting (both global and per-IP)
    const rateLimitResult = await contactRateLimiter.checkLimits(ip);

    // Set rate limit headers
    Object.entries(rateLimitResult.globalResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    Object.entries(rateLimitResult.ipResult.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

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

    // Process form data (validation, reCAPTCHA, sanitization, email)
    const result = await ContactFormProcessor.processForm(req.body);

    if (!result.success) {
      const error = result.error;

      let statusCode = 500;
      if (error?.type === 'validation' || error?.type === 'sanitization' || error?.type === 'recaptcha') {
        statusCode = 400;
      }

      const response: { message: string; errors?: unknown[] } = {
        message: error?.message || 'An error occurred'
      };

      if (error?.errors) {
        response.errors = error.errors;
      }

      return res.status(statusCode).json(response);
    }

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    logger.error('Contact form handler error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
}

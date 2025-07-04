import { sendEmail, sanitizeInput } from '@/lib/api/email';
import { rateLimit } from '@/lib/api/rateLimit';
import { verifyRecaptcha } from '@/lib/api/recaptcha';
import { contactFormServerSchema, contactFormSubmissionSchema } from '@/lib/validations/contact';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;

    // Apply rate limiting
    if (rateLimit(ip)) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    // Validate request body structure
    const validationResult = contactFormSubmissionSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('Contact form validation failed:', validationResult.error.errors);
      return res.status(400).json({
        message: 'Invalid form data',
        errors: validationResult.error.errors
      });
    }

    const { recaptchaToken, ...formData } = validationResult.data;

    // Verify reCAPTCHA
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidRecaptcha) {
      console.error('reCAPTCHA verification failed');
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    // Sanitize form data
    const sanitizedData = {
      firstName: sanitizeInput(formData.firstName),
      lastName: sanitizeInput(formData.lastName),
      email: sanitizeInput(formData.email),
      confirmEmail: sanitizeInput(formData.confirmEmail),
      message: sanitizeInput(formData.message)
    };

    // Validate sanitized data
    const serverValidationResult = contactFormServerSchema.safeParse(sanitizedData);
    if (!serverValidationResult.success) {
      console.error('Server validation failed after sanitization:', serverValidationResult.error.errors);
      return res.status(400).json({
        message: 'Invalid form data after sanitization',
        errors: serverValidationResult.error.errors
      });
    }

    // Send email using Resend
    await sendEmail(sanitizedData);

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof Error) {
      // Don't expose internal error details to client
      if (error.message.includes('configuration') || error.message.includes('not configured')) {
        return res.status(500).json({ message: 'Server configuration error' });
      }
    }

    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
}

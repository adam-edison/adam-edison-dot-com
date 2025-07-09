import { logger } from '@/lib/logger';

// Verify reCAPTCHA token - FAIL OPEN for better user experience
export async function verifyRecaptcha(token: string): Promise<boolean> {
  // Skip reCAPTCHA verification when threshold is 0, for better performance during testing
  if (process.env.RECAPTCHA_SCORE_THRESHOLD === '0') {
    return true;
  }

  // If no token provided, allow the request (fail-open)
  if (!token || token.trim() === '') {
    logger.warn('No reCAPTCHA token provided - allowing request (fail-open)');
    return true;
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    logger.error('reCAPTCHA secret key not configured - allowing request (fail-open)');
    return true; // FAIL OPEN - allow the request if not configured
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    if (!data.success) {
      logger.error('reCAPTCHA verification failed:', data['error-codes'], '- allowing request (fail-open)');
      return true; // FAIL OPEN - allow the request if verification fails
    }

    // Check score for reCAPTCHA v3 (score between 0.0 and 1.0)
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
    if (data.score && data.score < scoreThreshold) {
      logger.error('reCAPTCHA score too low:', data.score, '- allowing request (fail-open)');
      return true; // FAIL OPEN - allow the request even if score is low
    }

    return true;
  } catch (error) {
    logger.error('Error verifying reCAPTCHA:', error, '- allowing request (fail-open)');
    return true; // FAIL OPEN - allow the request if there's an error
  }
}

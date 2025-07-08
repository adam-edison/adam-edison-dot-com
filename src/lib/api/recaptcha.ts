// Verify reCAPTCHA token
export async function verifyRecaptcha(token: string): Promise<boolean> {
  // Skip reCAPTCHA verification when threshold is 0, for better performance during testing
  if (process.env.RECAPTCHA_SCORE_THRESHOLD === '0') {
    return true;
  }

  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    throw new Error('reCAPTCHA secret key not configured');
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
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return false;
    }

    // Check score for reCAPTCHA v3 (score between 0.0 and 1.0)
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
    if (data.score && data.score < scoreThreshold) {
      console.error('reCAPTCHA score too low:', data.score);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}

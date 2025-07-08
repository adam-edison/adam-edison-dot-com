import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test.beforeEach(() => {
    // Set reCAPTCHA threshold to 0 for testing to bypass verification
    process.env.RECAPTCHA_SCORE_THRESHOLD = '0';
  });

  test('should apply rate limiting to contact form API', async ({ request }) => {
    const contactData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      confirmEmail: 'test@example.com',
      message:
        'This is a test message for rate limiting functionality. It needs to be at least 50 characters long to pass validation.',
      recaptchaToken: 'test-token'
    };

    // Make rapid requests to trigger rate limiting
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(
        request.post('/api/contact', {
          data: contactData,
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.100' // Simulate specific IP
          }
        })
      );
    }

    const responses = await Promise.all(requests);

    // Check that at least some requests are rate limited (status 429)
    const rateLimitedResponses = responses.filter((response) => response.status() === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);

    // Verify rate limit response message
    if (rateLimitedResponses.length > 0) {
      const body = await rateLimitedResponses[0].json();
      expect(body.message).toContain('Too many requests');
    }
  });
});

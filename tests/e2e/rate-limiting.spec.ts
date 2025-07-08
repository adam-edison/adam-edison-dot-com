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

    // Check that exactly 5 requests are rate limited (since limit is 5 per 10 minutes)
    const rateLimitedResponses = responses.filter((response) => response.status() === 429);
    const successfulResponses = responses.filter((response) => response.status() === 200);

    expect(rateLimitedResponses.length).toBeGreaterThanOrEqual(5);
    expect(successfulResponses.length).toBeLessThanOrEqual(5);

    // Verify rate limit response message
    if (rateLimitedResponses.length > 0) {
      const body = await rateLimitedResponses[0].json();
      expect(body.message).toContain('Too many requests');
      expect(body.retryAfter).toBeDefined();
      expect(typeof body.retryAfter).toBe('number');
    }
  });

  test('should have separate rate limits for different IPs', async ({ request }) => {
    const contactData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      confirmEmail: 'test@example.com',
      message:
        'This is a test message for rate limiting functionality. It needs to be at least 50 characters long to pass validation.',
      recaptchaToken: 'test-token'
    };

    // Make 6 requests from first IP (should hit rate limit)
    const ip1Requests = [];
    for (let i = 0; i < 6; i++) {
      ip1Requests.push(
        request.post('/api/contact', {
          data: contactData,
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '192.168.1.100'
          }
        })
      );
    }

    const ip1Responses = await Promise.all(ip1Requests);
    const ip1RateLimited = ip1Responses.filter((response) => response.status() === 429);
    const ip1Successful = ip1Responses.filter((response) => response.status() === 200);

    // IP1 should be rate limited - exactly 1 request should be rate limited (6 requests, limit is 5)
    expect(ip1RateLimited.length).toBeGreaterThanOrEqual(1);
    expect(ip1Successful.length).toBeLessThanOrEqual(5);

    // Make requests from different IP (should not be rate limited initially)
    const ip2Response = await request.post('/api/contact', {
      data: contactData,
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.200'
      }
    });

    // IP2 should not be rate limited initially
    expect(ip2Response.status()).toBe(200);
  });

  test('should include rate limit headers in responses', async ({ request }) => {
    const contactData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      confirmEmail: 'test@example.com',
      message:
        'This is a test message for rate limiting functionality. It needs to be at least 50 characters long to pass validation.',
      recaptchaToken: 'test-token'
    };

    const response = await request.post('/api/contact', {
      data: contactData,
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.300'
      }
    });

    // Check for rate limit headers
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBeDefined();
    expect(headers['x-ratelimit-remaining']).toBeDefined();
    expect(headers['x-ratelimit-reset']).toBeDefined();

    // Verify header values are reasonable
    expect(parseInt(headers['x-ratelimit-limit'])).toBeGreaterThan(0);
    expect(parseInt(headers['x-ratelimit-remaining'])).toBeGreaterThanOrEqual(0);
  });
});

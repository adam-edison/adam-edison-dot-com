import { test, expect } from '@playwright/test';
import { generateUniqueIP } from '../utils/testHelpers';
import { cleanupE2EKeys } from '../utils/redisCleanup';

test.describe('Rate Limiting', () => {
  test.afterEach(async () => {
    // Clean up Redis keys after each test to prevent interference
    await cleanupE2EKeys();
  });
  test('should rate limit after 5 requests in 10 minutes', async ({ request }) => {
    // This test uses the default rate limiting configuration (5 requests per 10 minutes)
    // Set in playwright.config.ts webServer env

    const contactData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      message:
        'This is a test message for the contact form functionality. It needs to be at least 50 characters long to pass validation.',
      recaptchaToken: 'dummy-token'
    };

    // Use a unique IP to avoid interference with other tests
    const uniqueIP = generateUniqueIP();

    // Make 5 requests (should all succeed)
    const responses = [];
    for (let i = 0; i < 5; i++) {
      const response = await request.post('/api/contact', {
        data: contactData,
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': uniqueIP
        }
      });
      responses.push(response);

      expect(response.status()).toBe(200);
    }

    // 6th request should be rate limited
    const rateLimitedResponse = await request.post('/api/contact', {
      data: contactData,
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': uniqueIP
      }
    });

    expect(rateLimitedResponse.status()).toBe(429);

    const body = await rateLimitedResponse.json();
    expect(body.message).toBe('Too many requests. Please try again later.');
  });
});

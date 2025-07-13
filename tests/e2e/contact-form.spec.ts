import { test, expect } from '@playwright/test';
import { generateUniqueIP } from '../utils/testHelpers';
import { cleanupE2EKeys } from '../utils/redisCleanup';

test.describe('Contact Form', () => {
  test.afterEach(async () => {
    // Clean up Redis keys after each test to prevent interference
    await cleanupE2EKeys();
  });
  test('should successfully submit contact form', async ({ request }) => {
    const contactData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      message:
        'This is a test message for the contact form functionality. It needs to be at least 50 characters long to pass validation.',
      recaptchaToken: 'dummy-token'
    };

    // Use a unique IP to avoid rate limiting between test runs
    const uniqueIP = generateUniqueIP();

    const response = await request.post('/api/contact', {
      data: contactData,
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': uniqueIP
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.message).toBe('Message sent successfully');
  });
});

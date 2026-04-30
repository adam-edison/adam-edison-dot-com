import { test, expect } from '@playwright/test';
import { generateUniqueIP } from '@tests/utils/testHelpers';
import { cleanupE2EKeys } from '@tests/utils/redisCleanup';

test.describe('Contact Form (fail-closed)', () => {
  test.afterEach(async () => {
    await cleanupE2EKeys();
  });

  test('rejects with 400 when Cloudflare rejects the token', async ({ request }) => {
    const contactData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      message:
        'This is a test message for the contact form functionality. It needs to be at least 50 characters long to pass validation.',
      turnstileToken: 'any-token-the-server-will-reject'
    };

    const response = await request.post('/api/contact', {
      data: contactData,
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': generateUniqueIP()
      }
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message.toLowerCase()).toContain('captcha');
  });
});

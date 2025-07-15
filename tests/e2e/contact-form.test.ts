import { test, expect } from '@playwright/test';
import { generateUniqueIP } from '@tests/utils/testHelpers';
import { cleanupE2EKeys } from '@tests/utils/redisCleanup';

test.describe('Contact Form', () => {
  test.afterEach(async () => {
    await cleanupE2EKeys();
  });

  test('should show error when email sending is disabled', async ({ page }) => {
    // Override environment variable to disable email sending
    process.env.SEND_EMAIL_ENABLED = 'false';

    // Navigate to contact page
    await page.goto('/contact');

    // Wait for the form to load and check config
    await page.waitForLoadState('networkidle');

    // The contact form should show error state when email sending is disabled
    await expect(page.locator('text=Contact form is not available.')).toBeVisible();

    // Form should not be visible when there's a config error
    await expect(page.locator('form')).not.toBeVisible();

    // Restore environment variable
    process.env.SEND_EMAIL_ENABLED = 'true';
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

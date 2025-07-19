import { test, expect } from '@playwright/test';
import { generateUniqueIP } from '@tests/utils/testHelpers';
import { cleanupE2EKeys } from '@tests/utils/redisCleanup';

test.describe('Contact Form', () => {
  test.afterEach(async () => {
    await cleanupE2EKeys();
  });

  test('should show error when email service is not configured', async ({ page }) => {
    // Mock the email service check to return error state (503 status)
    await page.route('/api/email-service-check', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Email service is not properly configured',
          code: 'SERVICE_UNAVAILABLE'
        })
      });
    });

    // Navigate to contact page
    await page.goto('/contact');

    // Wait for the form to load and check config
    await page.waitForLoadState('networkidle');

    // The contact form should show error state when email sending is disabled
    await expect(page.locator('text=Contact form is not available.')).toBeVisible();

    // Form should not be visible when there's a config error
    await expect(page.locator('form')).not.toBeVisible();
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

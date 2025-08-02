import { test, expect } from '@playwright/test';
import { cleanupE2EKeys } from '@tests/utils/redisCleanup';

test.describe('Contact Form', () => {
  test.afterEach(async () => {
    await cleanupE2EKeys();
  });

  // Note: These e2e tests don't include Turnstile verification because:
  // 1. Turnstile requires a real browser environment with the widget loaded
  // 2. The API can work without Turnstile when TURNSTILE_SECRET_KEY is not configured
  // 3. Turnstile functionality is thoroughly tested in unit and integration tests

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

  test('should successfully submit contact form', async ({ page }) => {
    // Navigate to the contact page as a user would
    await page.goto('/contact');

    // Wait for the form to load
    await page.waitForSelector('form');

    // Fill in the form fields as a user would
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill(
      'textarea[name="message"]',
      'This is a test message for the contact form functionality. It needs to be at least 50 characters long to pass validation.'
    );

    // Submit the form (Turnstile is disabled in test environment)
    await page.click('button[type="submit"]');

    // Wait for success message
    await page.waitForSelector('text=Message Sent!', { timeout: 10000 });

    // Verify the success message is displayed
    await expect(page.locator('text=Message Sent!')).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { cleanupE2EKeys } from '@tests/utils/redisCleanup';

test.describe('Rate Limiting', () => {
  test.beforeEach(async () => {
    await cleanupE2EKeys();
  });

  test.afterEach(async () => {
    await cleanupE2EKeys();
  });

  test('should rate limit after 5 requests in 10 minutes', async ({ page }) => {
    // This test uses the configured rate limiting (5 requests per 10 minutes)
    // Set in playwright.config.ts webServer env

    // Navigate to the contact page
    await page.goto('/contact');

    // Make 5 successful submissions
    for (let i = 0; i < 5; i++) {
      // Wait for form to be ready
      await page.waitForSelector('form');

      // Fill in the form with unique email to avoid email rate limiting
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'User');
      await page.fill('input[name="email"]', `test${i}@example.com`);
      await page.fill(
        'textarea[name="message"]',
        'This is a test message for the contact form functionality. It needs to be at least 50 characters long to pass validation.'
      );

      // Submit the form (Turnstile is disabled in test environment)
      await page.click('button[type="submit"]');

      // Wait for success message
      await page.waitForSelector('text=Message Sent!', { timeout: 10000 });

      // Reload the page for the next submission
      if (i < 4) {
        await page.reload();
      }
    }

    // Reload for the 6th attempt
    await page.reload();
    await page.waitForSelector('form');

    // Fill in the form again with unique email to avoid email rate limiting
    await page.fill('input[name="firstName"]', 'Test');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'test5@example.com');
    await page.fill(
      'textarea[name="message"]',
      'This is a test message for the contact form functionality. It needs to be at least 50 characters long to pass validation.'
    );

    // Submit the form (should be rate limited)
    await page.click('button[type="submit"]');

    // Wait for rate limit error message
    await page.waitForSelector('text=Too many requests. Please try again later.', { timeout: 10000 });

    // Verify the error message is displayed
    await expect(page.locator('text=Too many requests. Please try again later.')).toBeVisible();
  });
});

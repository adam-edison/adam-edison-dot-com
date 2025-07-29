/**
  Manual Contact Form Test with Turnstile
 
  This test validates the full contact form functionality including Turnstile captcha.
 
  To run this test:
  npm run test:interactive -- --grep "Manual Contact Form Test with Turnstile"
 
  Prerequisites:
  - Configure your .env.local with valid Turnstile keys
  - Configure Redis connection for CSRF tokens
  - Optionally configure email service for actual email sending
 
  The test will:
  1. Open a browser window
  2. Navigate to the contact page
  3. Give you 30 seconds to manually fill out the form and complete Turnstile
  4. Verify the submission was successful
 */

import { test, expect } from '@playwright/test';
import { Logger } from '@/shared/Logger';

const logger = new Logger();

test.describe('Manual Contact Form Test with Turnstile', () => {
  test('should allow manual form submission with Turnstile verification', async ({ page }) => {
    logger.info('\n=== MANUAL TEST INSTRUCTIONS ===');
    logger.info('1. A browser window will open to the contact page');
    logger.info('2. You have 30 seconds to:');
    logger.info('   - Fill in all form fields');
    logger.info('   - Complete the Turnstile verification');
    logger.info('   - Click the submit button');
    logger.info('3. The test will then verify the submission was successful');
    logger.info('================================\n');

    // Navigate to the contact page
    await page.goto('/contact');

    // Wait for the form to load
    await page.waitForSelector('form', { timeout: 10000 });

    // Give user time to see the page
    await page.waitForTimeout(2000);

    // Highlight the form for visibility
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) {
        form.style.border = '3px solid #3b82f6';
        form.style.borderRadius = '8px';
      }
    });

    logger.info('✅ Contact form loaded. Please fill out the form now...');

    // Wait 30 seconds for user to fill out form and submit
    logger.info('⏱️  Waiting 30 seconds for you to submit the form...');
    await page.waitForTimeout(30000);

    // Check if success message is visible
    const successMessage = page.locator('text=Message sent successfully');
    const isSuccess = await successMessage.isVisible().catch(() => false);

    if (isSuccess) {
      logger.info('✅ SUCCESS: Form was submitted successfully!');
      await expect(successMessage).toBeVisible();
    } else {
      // Check for error messages
      const errorMessages = [
        'Too many requests',
        'Invalid security token',
        'Anti-bot verification failed',
        'Failed to send message'
      ];

      let foundError = false;
      for (const errorMsg of errorMessages) {
        const errorLocator = page.locator(`text=${errorMsg}`);
        if (await errorLocator.isVisible().catch(() => false)) {
          logger.error(`❌ ERROR: ${errorMsg}`);
          foundError = true;
          break;
        }
      }

      if (!foundError) {
        // Check if form is still visible (user didn't submit)
        const formVisible = await page
          .locator('form')
          .isVisible()
          .catch(() => false);
        if (formVisible) {
          logger.error('❌ TIMEOUT: Form was not submitted within 30 seconds');
          throw new Error('Form was not submitted within the time limit');
        } else {
          logger.error('❌ UNKNOWN: Could not determine form submission status');
          throw new Error('Could not verify form submission');
        }
      }
    }

    // Keep browser open for a few seconds to see the result
    await page.waitForTimeout(3000);
  });
});

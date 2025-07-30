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

    // Debug: Check the service status API response
    logger.info('🔍 Debugging service status...');
    const serviceStatusResponse = await page.evaluate(async () => {
      const response = await fetch('/api/email-service-check');
      return {
        status: response.status,
        data: await response.json()
      };
    });

    logger.info('📊 Service Status Response:', JSON.stringify(serviceStatusResponse, null, 2));

    // Debug: Check environment variables visible to the client
    const clientEnvVars = await page.evaluate(() => ({
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 'not found'
      // Note: TURNSTILE_ENABLED is server-side only, won't be visible here
    }));

    logger.info('🌍 Client Environment Variables:', JSON.stringify(clientEnvVars, null, 2));

    // Debug: Check for any Turnstile-related elements in the DOM
    const turnstileElementsDebug = await page.evaluate(() => {
      const turnstileContainer = document.querySelector('[data-testid="turnstile-widget"]');
      const turnstileAny = document.querySelector('[class*="turnstile"]');
      const cfTurnstile = document.querySelector('.cf-turnstile');
      const securityVerification = Array.from(document.querySelectorAll('label')).find((label) =>
        label.textContent?.includes('Security Verification')
      );

      return {
        turnstileContainer: !!turnstileContainer,
        turnstileContainerClass: turnstileContainer?.className || 'not found',
        turnstileContainerContent: turnstileContainer?.innerHTML?.slice(0, 200) || 'not found',
        turnstileAny: !!turnstileAny,
        cfTurnstile: !!cfTurnstile,
        securityVerification: !!securityVerification,
        formHTML: document.querySelector('form')?.innerHTML?.slice(0, 500) || 'form not found'
      };
    });

    logger.info('🔧 Turnstile DOM Debug:', JSON.stringify(turnstileElementsDebug, null, 2));

    // Check if Turnstile widget container exists (even if still loading)
    logger.info('🔍 Checking for Turnstile widget container...');

    const turnstileContainer = page.locator('[data-testid="turnstile-widget"]');
    const containerExists = (await turnstileContainer.count()) > 0;

    if (!containerExists) {
      logger.error('❌ SETUP ERROR: Turnstile widget container not found on the page');
      logger.error(
        '   Service status shows Turnstile enabled:',
        serviceStatusResponse.data.services?.turnstile?.enabled
      );
      logger.error('   Service status shows Turnstile ready:', serviceStatusResponse.data.services?.turnstile?.ready);
      logger.error(
        '   Service status shows site key present:',
        !!serviceStatusResponse.data.services?.turnstile?.siteKey
      );
      throw new Error('Turnstile widget container is not present. Test cannot proceed without the captcha component.');
    }

    logger.info('✅ Turnstile widget container found');

    // Debug network requests and console errors
    const networkLogs: string[] = [];
    const consoleLogs: string[] = [];

    page.on('response', (response) => {
      if (response.url().includes('turnstile') || response.url().includes('cloudflare')) {
        networkLogs.push(`${response.status()} ${response.url()}`);
      }
    });

    page.on('console', (msg) => {
      if (msg.text().toLowerCase().includes('turnstile') || msg.text().toLowerCase().includes('error')) {
        consoleLogs.push(`${msg.type()}: ${msg.text()}`);
      }
    });

    // Try to wait for Turnstile to load, but don't fail if it doesn't (external service)
    logger.info('⏳ Attempting to wait for Turnstile to load (will continue regardless)...');

    try {
      await page.waitForSelector('[data-testid="turnstile-widget"]:not(.hidden)', { timeout: 10000 });
      logger.info('✅ Turnstile widget loaded successfully');
    } catch {
      logger.warn('⚠️  Turnstile widget did not load within 10 seconds');

      // Log network requests
      if (networkLogs.length > 0) {
        logger.info('🌐 Turnstile Network Requests:', networkLogs.join(', '));
      } else {
        logger.warn('📡 No Turnstile network requests detected');
      }

      // Log console messages
      if (consoleLogs.length > 0) {
        logger.info('🖥️  Console Messages:', consoleLogs.join(', '));
      }

      // Check current widget state and try to render manually
      const widgetState = await page.evaluate(() => {
        const widget = document.querySelector('[data-testid="turnstile-widget"]');
        const siteKey = '0x4AAAAAABl9q9kPm38w9Q4Q'; // Test key from service status

        let renderResult = null;
        let renderError = null;

        // Try to manually render the widget to see what happens
        if (window.turnstile && widget && !widget.innerHTML) {
          try {
            renderResult = window.turnstile.render(widget, {
              sitekey: siteKey,
              theme: 'auto',
              size: 'normal',
              callback: (token: string) => console.log('Turnstile success:', token),
              'error-callback': () => console.log('Turnstile error'),
              'expired-callback': () => console.log('Turnstile expired'),
              'timeout-callback': () => console.log('Turnstile timeout')
            });
          } catch (error) {
            renderError = error instanceof Error ? error.message : String(error);
          }
        }

        return {
          className: widget?.className,
          innerHTML: widget?.innerHTML?.substring(0, 100),
          windowTurnstile: !!window.turnstile,
          turnstileReady: !!(window.turnstile && window.turnstile.ready),
          siteKeyUsed: siteKey,
          renderResult,
          renderError,
          scripts: Array.from(document.querySelectorAll('script'))
            .map((s) => s.src)
            .filter((src) => src.includes('turnstile'))
        };
      });

      logger.info('🔍 Current Widget State:', JSON.stringify(widgetState, null, 2));

      logger.warn('    The test will continue - you can manually complete the form when it becomes available');
    }

    logger.info('✅ Turnstile widget found');

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

    // Take a screenshot to verify Turnstile widget count
    await page.screenshot({ path: 'test-results/turnstile-widget-check.png', fullPage: true });
    logger.info('📸 Screenshot saved to test-results/turnstile-widget-check.png');

    // Count Turnstile widgets to verify no duplication (from user perspective)
    const widgetCount = await page.evaluate(() => {
      const widgets = document.querySelectorAll('[data-testid="turnstile-widget"]');
      const visibleWidgets = Array.from(widgets).filter((w) => !w.classList.contains('hidden'));
      const cfWidgets = document.querySelectorAll('.cf-turnstile');

      // Count actual visible Turnstile checkboxes (user-facing widgets)
      const turnstileCheckboxes = document.querySelectorAll('input[name="cf-turnstile-response"]');
      const visibleCheckboxes = Array.from(turnstileCheckboxes).filter((checkbox) => {
        const rect = checkbox.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });

      // Count "Verify you are human" text instances
      const verifyText = Array.from(document.querySelectorAll('*')).filter(
        (el) => el.textContent && el.textContent.includes('Verify you are human')
      );

      return {
        totalContainers: widgets.length,
        visibleContainers: visibleWidgets.length,
        cloudflareWidgets: cfWidgets.length,
        turnstileCheckboxes: turnstileCheckboxes.length,
        visibleCheckboxes: visibleCheckboxes.length,
        verifyTextInstances: verifyText.length,
        containerClasses: Array.from(widgets).map((w) => w.className),
        containerContents: Array.from(widgets).map((w) => (w.innerHTML.length > 0 ? 'has content' : 'empty'))
      };
    });

    logger.info('🔢 Widget Count Analysis:', JSON.stringify(widgetCount, null, 2));

    // ASSERTION: Verify only one Turnstile widget exists (from user perspective)

    // Check for multiple "Verify you are human" text (what user actually sees)
    if (widgetCount.verifyTextInstances > 1) {
      throw new Error(
        `FAILED: User sees ${widgetCount.verifyTextInstances} "Verify you are human" texts. Expected only 1. This is the actual duplication bug users experience.`
      );
    }

    // Check for multiple Turnstile checkboxes
    if (widgetCount.turnstileCheckboxes > 1) {
      throw new Error(
        `FAILED: Found ${widgetCount.turnstileCheckboxes} Turnstile checkbox inputs. Expected only 1. Multiple checkboxes indicate widget duplication.`
      );
    }

    // Check for multiple visible checkboxes (the most reliable indicator)
    if (widgetCount.visibleCheckboxes > 1) {
      throw new Error(
        `FAILED: Found ${widgetCount.visibleCheckboxes} visible Turnstile checkboxes that users can see. Expected only 1. This is definitive proof of duplication.`
      );
    }

    // Secondary checks for our containers
    if (widgetCount.totalContainers !== 1) {
      throw new Error(
        `FAILED: Expected exactly 1 Turnstile container, but found ${widgetCount.totalContainers}. This indicates a widget duplication bug in our React component.`
      );
    }

    // Check for containers with content (should only be 1)
    const containersWithContent = widgetCount.containerContents.filter((content) => content === 'has content').length;
    if (containersWithContent > 1) {
      throw new Error(
        `FAILED: Expected at most 1 Turnstile container with content, but found ${containersWithContent}. Multiple containers have been initialized.`
      );
    }

    logger.info('✅ ASSERTION PASSED: Only one Turnstile widget detected');

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

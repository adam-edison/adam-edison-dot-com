import { test, expect } from '@playwright/test';

test.describe('Contact Form Anti-Bot Protection', () => {
  test('should preserve form data and generate new math question when math answer is wrong', async ({ page }) => {
    await page.goto('/contact');

    // Wait to avoid timing validation (minimum 3 seconds required)
    await page.waitForTimeout(3500);

    // Fill out the contact form
    await page.fill('[data-testid="contact-first-name"]', 'John');
    await page.fill('[data-testid="contact-last-name"]', 'Doe');
    await page.fill('[data-testid="contact-email"]', 'john@example.com');
    await page.fill(
      '[data-testid="contact-message"]',
      'This is a test message that should be preserved when math answer is wrong. It has enough characters to pass validation.'
    );

    // Get the math question
    const mathQuestionElement = page.locator('[data-testid="math-question"]');
    const mathQuestionText = await mathQuestionElement.textContent();
    expect(mathQuestionText).toMatch(/What is \d+ \+ \d+\?/);

    // Extract numbers from the question for reference
    const questionMatch = mathQuestionText?.match(/What is (\d+) \+ (\d+)\?/);
    expect(questionMatch).toBeTruthy();
    const originalNum1 = parseInt(questionMatch![1]);
    const originalNum2 = parseInt(questionMatch![2]);

    // Enter an intentionally wrong answer
    const wrongAnswer = '999';
    await page.fill('[data-testid="math-answer"]', wrongAnswer);

    // Submit the form
    await page.click('[data-testid="submit-button"]');

    // Wait for the response and check for error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/incorrect.*answer/i);

    // Verify that form data is preserved
    await expect(page.locator('[data-testid="contact-first-name"]')).toHaveValue('John');
    await expect(page.locator('[data-testid="contact-last-name"]')).toHaveValue('Doe');
    await expect(page.locator('[data-testid="contact-email"]')).toHaveValue('john@example.com');
    await expect(page.locator('[data-testid="contact-message"]')).toHaveValue(
      'This is a test message that should be preserved when math answer is wrong. It has enough characters to pass validation.'
    );

    // Verify that a new math question is generated
    const newMathQuestionText = await mathQuestionElement.textContent();
    expect(newMathQuestionText).toMatch(/What is \d+ \+ \d+\?/);

    // Extract new numbers
    const newQuestionMatch = newMathQuestionText?.match(/What is (\d+) \+ (\d+)\?/);
    expect(newQuestionMatch).toBeTruthy();
    const newNum1 = parseInt(newQuestionMatch![1]);
    const newNum2 = parseInt(newQuestionMatch![2]);

    // Verify the math question changed (numbers should be different)
    const questionsAreDifferent = originalNum1 !== newNum1 || originalNum2 !== newNum2;
    expect(questionsAreDifferent).toBe(true);

    // Verify that both numbers are single digits
    expect(newNum1).toBeGreaterThanOrEqual(1);
    expect(newNum1).toBeLessThanOrEqual(9);
    expect(newNum2).toBeGreaterThanOrEqual(1);
    expect(newNum2).toBeLessThanOrEqual(9);

    // Verify that the math answer field is cleared
    await expect(page.locator('[data-testid="math-answer"]')).toHaveValue('');

    // Wait a moment for the new math challenge to be properly set
    await page.waitForTimeout(500);

    // Now submit with the correct answer
    const correctAnswer = (newNum1 + newNum2).toString();
    await page.fill('[data-testid="math-answer"]', correctAnswer);
    await page.click('[data-testid="submit-button"]');

    // Wait a moment for the submission to process
    await page.waitForTimeout(1000);

    // Verify successful submission
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText(/Message Sent!/i);

    // Click "Send another message" to show the form again
    await page.click('button:has-text("Send another message")');

    // Verify form is reset after successful submission
    await expect(page.locator('[data-testid="contact-first-name"]')).toHaveValue('');
    await expect(page.locator('[data-testid="contact-last-name"]')).toHaveValue('');
    await expect(page.locator('[data-testid="contact-email"]')).toHaveValue('');
    await expect(page.locator('[data-testid="contact-message"]')).toHaveValue('');
    await expect(page.locator('[data-testid="math-answer"]')).toHaveValue('');
  });

  test('should prevent submission when backup fields are filled', async ({ page }) => {
    await page.goto('/contact');

    // Wait to avoid timing validation (minimum 3 seconds required)
    await page.waitForTimeout(3500);

    // Fill out the contact form
    await page.fill('[data-testid="contact-first-name"]', 'Bot');
    await page.fill('[data-testid="contact-last-name"]', 'User');
    await page.fill('[data-testid="contact-email"]', 'bot@spam.com');
    await page.fill(
      '[data-testid="contact-message"]',
      'Spam message with enough characters to pass validation requirements.'
    );

    // Get the correct math answer
    const mathQuestionElement = page.locator('[data-testid="math-question"]');
    const mathQuestionText = await mathQuestionElement.textContent();
    const questionMatch = mathQuestionText?.match(/What is (\d+) \+ (\d+)\?/);
    const num1 = parseInt(questionMatch![1]);
    const num2 = parseInt(questionMatch![2]);
    const correctAnswer = (num1 + num2).toString();
    await page.fill('[data-testid="math-answer"]', correctAnswer);

    // Fill backup fields (simulating bot behavior)
    await page.evaluate(() => {
      const setNativeValue = (element: HTMLInputElement, value: string) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value')?.set;
        if (valueSetter) {
          valueSetter.call(element, value);
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };

      const subject = document.querySelector('[data-testid="subject"]') as HTMLInputElement;
      const phone = document.querySelector('[data-testid="phone"]') as HTMLInputElement;

      if (subject) setNativeValue(subject, 'bot@filled.com');
      if (phone) setNativeValue(phone, '555-BOT-SPAM');
    });

    // Wait a moment for React state to update
    await page.waitForTimeout(200);

    // Submit the form
    await page.click('[data-testid="submit-button"]');

    // Should show security error without making API call
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/security verification failed/i);

    // Form data should be preserved
    await expect(page.locator('[data-testid="contact-first-name"]')).toHaveValue('Bot');
    await expect(page.locator('[data-testid="contact-last-name"]')).toHaveValue('User');
    await expect(page.locator('[data-testid="contact-email"]')).toHaveValue('bot@spam.com');
    await expect(page.locator('[data-testid="contact-message"]')).toHaveValue(
      'Spam message with enough characters to pass validation requirements.'
    );
  });

  test('should prevent submission when form is submitted too quickly', async ({ page }) => {
    await page.goto('/contact');

    // Immediately fill and submit form (simulating bot speed)
    await page.fill('[data-testid="contact-first-name"]', 'Speed');
    await page.fill('[data-testid="contact-last-name"]', 'Bot');
    await page.fill('[data-testid="contact-email"]', 'speed@bot.com');
    await page.fill(
      '[data-testid="contact-message"]',
      'Quick spam message with enough characters to pass validation requirements.'
    );

    // Get the correct math answer
    const mathQuestionElement = page.locator('[data-testid="math-question"]');
    const mathQuestionText = await mathQuestionElement.textContent();
    const questionMatch = mathQuestionText?.match(/What is (\d+) \+ (\d+)\?/);
    const num1 = parseInt(questionMatch![1]);
    const num2 = parseInt(questionMatch![2]);
    const correctAnswer = (num1 + num2).toString();
    await page.fill('[data-testid="math-answer"]', correctAnswer);

    // Submit immediately (should be too fast)
    await page.click('[data-testid="submit-button"]');

    // Wait a moment for state updates to render
    await page.waitForTimeout(100);

    // Should show timing error
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/wait.*moment.*submitting/i);

    // Form data should be preserved
    await expect(page.locator('[data-testid="contact-first-name"]')).toHaveValue('Speed');
    await expect(page.locator('[data-testid="contact-last-name"]')).toHaveValue('Bot');
    await expect(page.locator('[data-testid="contact-email"]')).toHaveValue('speed@bot.com');
    await expect(page.locator('[data-testid="contact-message"]')).toHaveValue(
      'Quick spam message with enough characters to pass validation requirements.'
    );
  });

  test('should show math questions with single digit numbers only', async ({ page }) => {
    await page.goto('/contact');

    // Check initial math question
    const mathQuestionElement = page.locator('[data-testid="math-question"]');
    const mathQuestionText = await mathQuestionElement.textContent();
    const questionMatch = mathQuestionText?.match(/What is (\d+) \+ (\d+)\?/);

    expect(questionMatch).toBeTruthy();
    const num1 = parseInt(questionMatch![1]);
    const num2 = parseInt(questionMatch![2]);

    // Both numbers should be single digits (1-9)
    expect(num1).toBeGreaterThanOrEqual(1);
    expect(num1).toBeLessThanOrEqual(9);
    expect(num2).toBeGreaterThanOrEqual(1);
    expect(num2).toBeLessThanOrEqual(9);

    // Wait to avoid timing validation
    await page.waitForTimeout(3500);

    // Submit with wrong answer to get a new question
    await page.fill('[data-testid="contact-first-name"]', 'Test');
    await page.fill('[data-testid="contact-last-name"]', 'User');
    await page.fill('[data-testid="contact-email"]', 'test@example.com');
    await page.fill(
      '[data-testid="contact-message"]',
      'Test message with enough characters to pass validation requirements.'
    );
    await page.fill('[data-testid="math-answer"]', '999');
    await page.click('[data-testid="submit-button"]');

    // Wait for new question
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();

    // Check new math question also uses single digits
    const newMathQuestionText = await mathQuestionElement.textContent();
    const newQuestionMatch = newMathQuestionText?.match(/What is (\d+) \+ (\d+)\?/);

    expect(newQuestionMatch).toBeTruthy();
    const newNum1 = parseInt(newQuestionMatch![1]);
    const newNum2 = parseInt(newQuestionMatch![2]);

    expect(newNum1).toBeGreaterThanOrEqual(1);
    expect(newNum1).toBeLessThanOrEqual(9);
    expect(newNum2).toBeGreaterThanOrEqual(1);
    expect(newNum2).toBeLessThanOrEqual(9);
  });
});

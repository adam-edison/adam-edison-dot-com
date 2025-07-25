import { describe, test, expect, beforeEach } from 'vitest';
import { EmailService } from './EmailService';
import { ContactFormData } from './ContactFormValidator';
import { fail } from 'assert';

/* Run this test with:
  npm run test:manual -- --testNamePattern "Resend Email Integration"
*/

describe('Resend Email Integration (Manual)', () => {
  beforeEach(() => {
    const requiredEnvVars = ['RESEND_API_KEY', 'FROM_EMAIL', 'TO_EMAIL'];
    const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
      fail(`Skipping manual email test - missing environment variables: ${missingVars.join(', ')}`);
    }

    if (process.env.SEND_EMAIL_ENABLED === 'false' || !process.env.SEND_EMAIL_ENABLED) {
      fail('Skipping manual email test - SEND_EMAIL_ENABLED is set to "false"');
    }
  });

  test('should send email successfully', async () => {
    const testData: ContactFormData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      message: 'This is a manual integration test for email sending functionality.'
    };

    const emailServiceResult = EmailService.fromEnv();

    if (!emailServiceResult.success) {
      fail('Email service initialization failed');
    }

    const emailService = emailServiceResult.data;
    const result = await emailService.sendContactEmail(testData);

    expect(result).toMatchObject({
      data: {
        id: expect.stringMatching(/^(?!mock-email-id$).+/)
      },
      error: null
    });
  });
});

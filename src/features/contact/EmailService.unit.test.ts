import { describe, it, expect } from 'vitest';
import { expectErrorContaining } from '../../../tests/utils/testHelpers';
import { EmailService, EmailConfiguration } from './EmailService';

/*
  Run this test with:
  npm run test:unit src/features/contact/EmailService.unit.test.ts
*/

const validEnvironment: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  RESEND_API_KEY: 'test-key',
  FROM_EMAIL: 'from@test.com',
  TO_EMAIL: 'to@test.com',
  EMAIL_SENDER_NAME: 'Test Sender',
  EMAIL_RECIPIENT_NAME: 'Test Recipient',
  SEND_EMAIL_ENABLED: 'false'
} as unknown as NodeJS.ProcessEnv;

describe('EmailService', () => {
  describe('constructor validation', () => {
    it('should throw error when config is invalid', async () => {
      const invalidConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: 'invalid-email',
        toEmail: '',
        senderName: '',
        recipientName: '',
        sendEmailEnabled: false
      };

      await expectErrorContaining(async () => {
        new EmailService(invalidConfig);
      }, ['Email service configuration errors', 'RESEND_API_KEY', 'FROM_EMAIL', 'TO_EMAIL']);
    });

    it('should successfully create EmailService when config is valid', () => {
      const validConfig: EmailConfiguration = {
        apiKey: 'test-key',
        fromEmail: 'from@test.com',
        toEmail: 'to@test.com',
        senderName: 'Test Sender',
        recipientName: 'Test Recipient',
        sendEmailEnabled: false
      };

      expect(() => new EmailService(validConfig)).not.toThrow();
    });
  });

  describe('fromEnv factory method', () => {
    it('should set sendEmailEnabled to true when SEND_EMAIL_ENABLED is "true"', () => {
      const envWithEnabledEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'true'
      };

      const service = EmailService.fromEnv(envWithEnabledEmail);
      expect(service.getConfiguration().sendEmailEnabled).toBe(true);
    });

    it('should set sendEmailEnabled to false when SEND_EMAIL_ENABLED is "false"', () => {
      const envWithDisabledEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'false'
      };

      const service = EmailService.fromEnv(envWithDisabledEmail);
      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });

    it('should default sendEmailEnabled to false when SEND_EMAIL_ENABLED is undefined', () => {
      const envWithUndefinedEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: undefined
      };

      const service = EmailService.fromEnv(envWithUndefinedEmail);
      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });

    it('should default sendEmailEnabled to false when SEND_EMAIL_ENABLED is any other value', () => {
      const envWithOtherValue: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'maybe'
      };

      const service = EmailService.fromEnv(envWithOtherValue);
      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });
  });
});

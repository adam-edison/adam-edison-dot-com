import { describe, it, expect } from 'vitest';
import { EmailService } from './EmailService';

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
  describe('fromEnv factory method validation', () => {
    it('should return error when environment config is invalid', () => {
      const invalidEnv: NodeJS.ProcessEnv = {
        NODE_ENV: 'test',
        RESEND_API_KEY: '',
        FROM_EMAIL: 'invalid-email',
        TO_EMAIL: '',
        EMAIL_SENDER_NAME: '',
        EMAIL_RECIPIENT_NAME: '',
        SEND_EMAIL_ENABLED: 'false'
      };

      const result = EmailService.fromEnv(invalidEnv);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('Email service configuration errors');
        expect(result.error.message).toContain('RESEND_API_KEY');
        expect(result.error.message).toContain('FROM_EMAIL');
        expect(result.error.message).toContain('TO_EMAIL');
      }
    });

    it('should successfully create EmailService when environment config is valid', () => {
      const result = EmailService.fromEnv(validEnvironment);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getConfiguration().sendEmailEnabled).toBe(false);
      }
    });
  });

  describe('fromEnv factory method configuration', () => {
    it('should set sendEmailEnabled to true when SEND_EMAIL_ENABLED is "true"', () => {
      const envWithEnabledEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'true'
      };

      const result = EmailService.fromEnv(envWithEnabledEmail);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getConfiguration().sendEmailEnabled).toBe(true);
      }
    });

    it('should set sendEmailEnabled to false when SEND_EMAIL_ENABLED is "false"', () => {
      const envWithDisabledEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'false'
      };

      const result = EmailService.fromEnv(envWithDisabledEmail);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getConfiguration().sendEmailEnabled).toBe(false);
      }
    });

    it('should default sendEmailEnabled to false when SEND_EMAIL_ENABLED is undefined', () => {
      const envWithUndefinedEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: undefined
      };

      const result = EmailService.fromEnv(envWithUndefinedEmail);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getConfiguration().sendEmailEnabled).toBe(false);
      }
    });

    it('should default sendEmailEnabled to false when SEND_EMAIL_ENABLED is any other value', () => {
      const envWithOtherValue: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'maybe'
      };

      const result = EmailService.fromEnv(envWithOtherValue);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.getConfiguration().sendEmailEnabled).toBe(false);
      }
    });
  });
});

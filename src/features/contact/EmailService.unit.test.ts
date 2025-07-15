import { describe, it, expect, vi } from 'vitest';
import { expectErrorContaining } from '../../../tests/utils/testHelpers';
import { EmailService } from './EmailService';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';

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
  describe('fromEnv with validator injection', () => {
    it('should throw error when validator returns configured: false', async () => {
      const mockValidator = {
        validate: vi.fn().mockReturnValue({
          configured: false,
          problems: ['RESEND_API_KEY is not configured', 'FROM_EMAIL is not configured']
        })
      };

      await expectErrorContaining(async () => {
        EmailService.fromEnv(validEnvironment, mockValidator as unknown as EmailServiceConfigurationValidator);
      }, ['Email service configuration errors', 'RESEND_API_KEY is not configured', 'FROM_EMAIL is not configured']);
    });

    it('should successfully create EmailService when validator returns configured: true', () => {
      const mockValidator = {
        validate: vi.fn().mockReturnValue({
          configured: true
        })
      };

      expect(() => EmailService.fromEnv(validEnvironment, mockValidator as unknown as EmailServiceConfigurationValidator)).not.toThrow();
    });

    it('should set sendEmailEnabled to true when SEND_EMAIL_ENABLED is "true"', () => {
      const mockValidator = {
        validate: vi.fn().mockReturnValue({
          configured: true
        })
      };

      const envWithEnabledEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'true'
      };

      const service = EmailService.fromEnv(envWithEnabledEmail, mockValidator as unknown as EmailServiceConfigurationValidator);
      expect(service.getConfiguration().sendEmailEnabled).toBe(true);
    });

    it('should set sendEmailEnabled to false when SEND_EMAIL_ENABLED is "false"', () => {
      const mockValidator = {
        validate: vi.fn().mockReturnValue({
          configured: true
        })
      };

      const envWithDisabledEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'false'
      };

      const service = EmailService.fromEnv(envWithDisabledEmail, mockValidator as unknown as EmailServiceConfigurationValidator);
      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });

    it('should default sendEmailEnabled to false when SEND_EMAIL_ENABLED is undefined', () => {
      const mockValidator = {
        validate: vi.fn().mockReturnValue({
          configured: true
        })
      };

      const envWithUndefinedEmail: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: undefined
      };

      const service = EmailService.fromEnv(envWithUndefinedEmail, mockValidator as unknown as EmailServiceConfigurationValidator);
      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });

    it('should default sendEmailEnabled to false when SEND_EMAIL_ENABLED is any other value', () => {
      const mockValidator = {
        validate: vi.fn().mockReturnValue({
          configured: true
        })
      };

      const envWithOtherValue: NodeJS.ProcessEnv = {
        ...validEnvironment,
        SEND_EMAIL_ENABLED: 'maybe'
      };

      const service = EmailService.fromEnv(envWithOtherValue, mockValidator as unknown as EmailServiceConfigurationValidator);
      expect(service.getConfiguration().sendEmailEnabled).toBe(false);
    });
  });
});

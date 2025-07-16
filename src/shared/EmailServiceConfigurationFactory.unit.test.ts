import { describe, it, expect } from 'vitest';
import { EmailServiceConfigurationFactory } from './EmailServiceConfigurationFactory';

describe('EmailServiceConfigurationFactory', () => {
  describe('fromEnv', () => {
    it('should extract configuration from environment variables', () => {
      const env = {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: 'to@test.com',
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient',
        SEND_EMAIL_ENABLED: 'true'
      } as unknown as NodeJS.ProcessEnv;

      const config = EmailServiceConfigurationFactory.fromEnv(env);

      expect(config).toEqual({
        apiKey: 'test-key',
        fromEmail: 'from@test.com',
        toEmail: 'to@test.com',
        senderName: 'Test Sender',
        recipientName: 'Test Recipient',
        sendEmailEnabled: true
      });
    });

    it('should default to empty strings and false for missing variables', () => {
      const env = {} as unknown as NodeJS.ProcessEnv;

      const config = EmailServiceConfigurationFactory.fromEnv(env);

      expect(config).toEqual({
        apiKey: '',
        fromEmail: '',
        toEmail: '',
        senderName: '',
        recipientName: '',
        sendEmailEnabled: false
      });
    });

    it('should set sendEmailEnabled to false when SEND_EMAIL_ENABLED is not "true"', () => {
      const env = {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: 'to@test.com',
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient',
        SEND_EMAIL_ENABLED: 'false'
      } as unknown as NodeJS.ProcessEnv;

      const config = EmailServiceConfigurationFactory.fromEnv(env);

      expect(config.sendEmailEnabled).toBe(false);
    });

    it('should set sendEmailEnabled to true only when SEND_EMAIL_ENABLED is exactly "true"', () => {
      const env = {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: 'to@test.com',
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient',
        SEND_EMAIL_ENABLED: 'true'
      } as unknown as NodeJS.ProcessEnv;

      const config = EmailServiceConfigurationFactory.fromEnv(env);

      expect(config.sendEmailEnabled).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailServiceConfigurationValidator } from './EmailServiceConfigurationValidator';
import { logger, Logger } from './Logger';
import { EmailConfiguration } from '@/features/contact/EmailService';

describe('EmailServiceConfigurationValidator', () => {
  let testLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    testLogger = logger;
    testLogger.clear();
  });

  describe('validate', () => {
    it('should return configured: true when all required variables are present and valid', () => {
      const validConfig: EmailConfiguration = {
        apiKey: 'test-key',
        fromEmail: 'from@test.com',
        toEmail: 'to@test.com',
        senderName: 'Test Sender',
        recipientName: 'Test Recipient',
        sendEmailEnabled: true
      };

      const result = EmailServiceConfigurationValidator.validate(validConfig);

      expect(result).toEqual({
        configured: true
      });
    });

    it('should return configured: false with specific problems when fields are invalid', () => {
      const invalidConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: 'invalid-email',
        toEmail: '',
        senderName: '',
        recipientName: '',
        sendEmailEnabled: false
      };

      const result = EmailServiceConfigurationValidator.validate(invalidConfig);

      expect(result).toEqual({
        configured: false,
        problems: [
          'RESEND_API_KEY: String must contain at least 1 character(s)',
          'FROM_EMAIL: Invalid email',
          'TO_EMAIL: Invalid email',
          'EMAIL_SENDER_NAME: String must contain at least 1 character(s)',
          'EMAIL_RECIPIENT_NAME: String must contain at least 1 character(s)'
        ]
      });

      const output = testLogger.getOutput();
      expect(output).toContain('ERROR Email service configuration validation failed');
    });

    it('should return configured: true when sendEmailEnabled is false but other fields are valid', () => {
      const validConfig: EmailConfiguration = {
        apiKey: 'test-key',
        fromEmail: 'from@test.com',
        toEmail: 'to@test.com',
        senderName: 'Test Sender',
        recipientName: 'Test Recipient',
        sendEmailEnabled: false
      };

      const result = EmailServiceConfigurationValidator.validate(validConfig);

      expect(result).toEqual({
        configured: true
      });
    });

    it('should return configured: false with multiple validation errors', () => {
      const invalidConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: 'invalid-email',
        toEmail: '',
        senderName: 'Test Sender',
        recipientName: '',
        sendEmailEnabled: true
      };

      const result = EmailServiceConfigurationValidator.validate(invalidConfig);

      expect(result).toEqual({
        configured: false,
        problems: [
          'RESEND_API_KEY: String must contain at least 1 character(s)',
          'FROM_EMAIL: Invalid email',
          'TO_EMAIL: Invalid email',
          'EMAIL_RECIPIENT_NAME: String must contain at least 1 character(s)'
        ]
      });
    });

    it('should return configured: false when all fields are empty', () => {
      const emptyConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: '',
        toEmail: '',
        senderName: '',
        recipientName: '',
        sendEmailEnabled: false
      };

      const result = EmailServiceConfigurationValidator.validate(emptyConfig);

      expect(result).toEqual({
        configured: false,
        problems: [
          'RESEND_API_KEY: String must contain at least 1 character(s)',
          'FROM_EMAIL: Invalid email',
          'TO_EMAIL: Invalid email',
          'EMAIL_SENDER_NAME: String must contain at least 1 character(s)',
          'EMAIL_RECIPIENT_NAME: String must contain at least 1 character(s)'
        ]
      });
    });

    it('should correctly map field names to environment variable names in error messages', () => {
      const invalidConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: '',
        toEmail: '',
        senderName: '',
        recipientName: '',
        sendEmailEnabled: false
      };

      const result = EmailServiceConfigurationValidator.validate(invalidConfig);

      expect(result.problems).toEqual(
        expect.arrayContaining([
          expect.stringContaining('RESEND_API_KEY:'),
          expect.stringContaining('FROM_EMAIL:'),
          expect.stringContaining('TO_EMAIL:'),
          expect.stringContaining('EMAIL_SENDER_NAME:'),
          expect.stringContaining('EMAIL_RECIPIENT_NAME:')
        ])
      );
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { strict as assert } from 'node:assert';
import { EmailServiceConfigurationValidator } from './EmailServiceConfigurationValidator';
import { EmailConfiguration } from '@/features/contact/EmailService';

describe('EmailServiceConfigurationValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validate', () => {
    it('should return success when all required variables are present and valid', () => {
      const validConfig: EmailConfiguration = {
        apiKey: 'test-key',
        fromEmail: 'from@test.com',
        toEmail: 'to@test.com',
        senderName: 'Test Sender',
        recipientName: 'Test Recipient',
        sendEmailEnabled: true
      };

      const result = EmailServiceConfigurationValidator.validate(validConfig);

      expect(result.success).toBe(true);
    });

    it('should return failure with ValidationError when fields are invalid', () => {
      const invalidConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: 'invalid-email',
        toEmail: '',
        senderName: '',
        recipientName: '',
        sendEmailEnabled: false
      };

      const result = EmailServiceConfigurationValidator.validate(invalidConfig);

      expect(result.success).toBe(false);
      assert(!result.success, 'Expected validation to fail');
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Email service configuration validation failed');
      expect(result.error.message).toContain('RESEND_API_KEY: String must contain at least 1 character(s)');
      expect(result.error.message).toContain('FROM_EMAIL: Invalid email');
      expect(result.error.message).toContain('TO_EMAIL: Invalid email');
      expect(result.error.message).toContain('EMAIL_SENDER_NAME: String must contain at least 1 character(s)');
      expect(result.error.message).toContain('EMAIL_RECIPIENT_NAME: String must contain at least 1 character(s)');
    });

    it('should return success when sendEmailEnabled is false but other fields are valid', () => {
      const validConfig: EmailConfiguration = {
        apiKey: 'test-key',
        fromEmail: 'from@test.com',
        toEmail: 'to@test.com',
        senderName: 'Test Sender',
        recipientName: 'Test Recipient',
        sendEmailEnabled: false
      };

      const result = EmailServiceConfigurationValidator.validate(validConfig);

      expect(result.success).toBe(true);
    });

    it('should return failure with multiple validation errors', () => {
      const invalidConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: 'invalid-email',
        toEmail: '',
        senderName: 'Test Sender',
        recipientName: '',
        sendEmailEnabled: true
      };

      const result = EmailServiceConfigurationValidator.validate(invalidConfig);

      expect(result.success).toBe(false);
      assert(!result.success, 'Expected validation to fail');
      expect(result.error.message).toContain('RESEND_API_KEY: String must contain at least 1 character(s)');
      expect(result.error.message).toContain('FROM_EMAIL: Invalid email');
      expect(result.error.message).toContain('TO_EMAIL: Invalid email');
      expect(result.error.message).toContain('EMAIL_RECIPIENT_NAME: String must contain at least 1 character(s)');
    });

    it('should return failure when all fields are empty', () => {
      const emptyConfig: EmailConfiguration = {
        apiKey: '',
        fromEmail: '',
        toEmail: '',
        senderName: '',
        recipientName: '',
        sendEmailEnabled: false
      };

      const result = EmailServiceConfigurationValidator.validate(emptyConfig);

      expect(result.success).toBe(false);
      assert(!result.success, 'Expected validation to fail');
      expect(result.error.message).toContain('RESEND_API_KEY: String must contain at least 1 character(s)');
      expect(result.error.message).toContain('FROM_EMAIL: Invalid email');
      expect(result.error.message).toContain('TO_EMAIL: Invalid email');
      expect(result.error.message).toContain('EMAIL_SENDER_NAME: String must contain at least 1 character(s)');
      expect(result.error.message).toContain('EMAIL_RECIPIENT_NAME: String must contain at least 1 character(s)');
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

      expect(result.success).toBe(false);
      assert(!result.success, 'Expected validation to fail');
      expect(result.error.message).toContain('RESEND_API_KEY:');
      expect(result.error.message).toContain('FROM_EMAIL:');
      expect(result.error.message).toContain('TO_EMAIL:');
      expect(result.error.message).toContain('EMAIL_SENDER_NAME:');
      expect(result.error.message).toContain('EMAIL_RECIPIENT_NAME:');
    });
  });
});

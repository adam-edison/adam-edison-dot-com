import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailServiceConfigurationValidator } from './EmailServiceConfigurationValidator';
import { logger, Logger } from './Logger';

describe('EmailServiceConfigurationValidator', () => {
  let testLogger: Logger;

  beforeEach(() => {
    vi.clearAllMocks();
    testLogger = logger;
    testLogger.clear();
  });

  describe('validate', () => {
    it('should return configured: true when all required variables are present and valid', () => {
      const validEnvironment = {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: 'to@test.com',
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient',
        SEND_EMAIL_ENABLED: 'true'
      };

      const validator = new EmailServiceConfigurationValidator();
      const result = validator.validate(validEnvironment);

      expect(result).toEqual({
        configured: true
      });
    });

    it('should return configured: false with specific problems when variables are missing', () => {
      const invalidEnvironment = {
        RESEND_API_KEY: 'test-key'
        // Missing other required variables
      };

      const validator = new EmailServiceConfigurationValidator();
      const result = validator.validate(invalidEnvironment);

      expect(result).toEqual({
        configured: false,
        problems: [
          'FROM_EMAIL is not configured',
          'TO_EMAIL is not configured',
          'EMAIL_SENDER_NAME is not configured',
          'EMAIL_RECIPIENT_NAME is not configured',
          'SEND_EMAIL_ENABLED must be set to "true"'
        ]
      });

      const output = testLogger.getOutput();
      expect(output).toContain('ERROR Email service configuration validation failed');
    });

    it('should return configured: false when SEND_EMAIL_ENABLED is not "true"', () => {
      const invalidEnvironment = {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: 'to@test.com',
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient',
        SEND_EMAIL_ENABLED: 'false'
      };

      const validator = new EmailServiceConfigurationValidator();
      const result = validator.validate(invalidEnvironment);

      expect(result).toEqual({
        configured: false,
        problems: ['SEND_EMAIL_ENABLED must be set to "true"']
      });

      const output = testLogger.getOutput();
      expect(output).toContain('ERROR Email service configuration validation failed');
    });

    it('should return configured: false when SEND_EMAIL_ENABLED is undefined', () => {
      const invalidEnvironment = {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: 'to@test.com',
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient'
        // SEND_EMAIL_ENABLED is undefined
      };

      const validator = new EmailServiceConfigurationValidator();
      const result = validator.validate(invalidEnvironment);

      expect(result).toEqual({
        configured: false,
        problems: ['SEND_EMAIL_ENABLED must be set to "true"']
      });
    });

    it('should return configured: false with multiple validation errors', () => {
      const invalidEnvironment = {
        RESEND_API_KEY: '', // empty string
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: '', // empty string
        EMAIL_SENDER_NAME: 'Test Sender',
        EMAIL_RECIPIENT_NAME: 'Test Recipient',
        SEND_EMAIL_ENABLED: 'maybe' // invalid value
      };

      const validator = new EmailServiceConfigurationValidator();
      const result = validator.validate(invalidEnvironment);

      expect(result).toEqual({
        configured: false,
        problems: [
          'RESEND_API_KEY is not configured',
          'TO_EMAIL is not configured',
          'SEND_EMAIL_ENABLED must be set to "true"'
        ]
      });
    });

    it('should return configured: false when all variables are missing', () => {
      const emptyEnvironment = {};

      const validator = new EmailServiceConfigurationValidator();
      const result = validator.validate(emptyEnvironment);

      expect(result).toEqual({
        configured: false,
        problems: [
          'RESEND_API_KEY is not configured',
          'FROM_EMAIL is not configured',
          'TO_EMAIL is not configured',
          'EMAIL_SENDER_NAME is not configured',
          'EMAIL_RECIPIENT_NAME is not configured',
          'SEND_EMAIL_ENABLED must be set to "true"'
        ]
      });
    });
  });
});

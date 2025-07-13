import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigChecker } from './ConfigChecker';
import { logger, InMemoryLogger } from './Logger';

describe('ConfigChecker', () => {
  let testLogger: InMemoryLogger;

  beforeEach(() => {
    vi.clearAllMocks();
    testLogger = logger as InMemoryLogger;
    testLogger.clear();
  });

  describe('checkConfiguration', () => {
    it('should return configured: true when all required variables are present', () => {
      const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL', 'TO_EMAIL'];
      const currentEnv = {
        RESEND_API_KEY: 'test-key',
        FROM_EMAIL: 'from@test.com',
        TO_EMAIL: 'to@test.com'
      };

      const result = ConfigChecker.checkConfiguration(requiredVars, currentEnv);

      expect(result).toEqual({
        configured: true
      });
    });

    it('should return configured: false when some variables are missing', () => {
      const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL', 'TO_EMAIL'];
      const currentEnv = {
        RESEND_API_KEY: 'test-key'
        // Missing FROM_EMAIL and TO_EMAIL
      };

      const result = ConfigChecker.checkConfiguration(requiredVars, currentEnv);

      expect(result).toEqual({
        configured: false,
        missingVars: ['FROM_EMAIL', 'TO_EMAIL']
      });

      const errorLogs = testLogger.getErrorLogs();
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].message).toBe('Missing required environment variables:');
      expect(errorLogs[0].args).toEqual([['FROM_EMAIL', 'TO_EMAIL']]);
    });

    it('should return configured: false when no variables are set', () => {
      const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL', 'TO_EMAIL'];
      const currentEnv = {}; // Empty environment

      const result = ConfigChecker.checkConfiguration(requiredVars, currentEnv);

      expect(result).toEqual({
        configured: false,
        missingVars: ['RESEND_API_KEY', 'FROM_EMAIL', 'TO_EMAIL']
      });
    });

    it('should include NEXT_PUBLIC_ variables in validation', () => {
      const requiredVars = ['NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'RECAPTCHA_SECRET_KEY'];
      const currentEnv = {}; // Empty environment

      const result = ConfigChecker.checkConfiguration(requiredVars, currentEnv);

      expect(result.missingVars).toEqual(['NEXT_PUBLIC_RECAPTCHA_SITE_KEY', 'RECAPTCHA_SECRET_KEY']);
    });

    it('should handle empty required variables list', () => {
      const requiredVars: string[] = [];
      const currentEnv = {};

      const result = ConfigChecker.checkConfiguration(requiredVars, currentEnv);

      expect(result).toEqual({
        configured: true
      });
    });

    it('should handle undefined environment values', () => {
      const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL'];
      const currentEnv = {
        RESEND_API_KEY: undefined,
        FROM_EMAIL: 'from@test.com'
      };

      const result = ConfigChecker.checkConfiguration(requiredVars, currentEnv);

      expect(result).toEqual({
        configured: false,
        missingVars: ['RESEND_API_KEY']
      });
    });

    it('should handle empty string environment values', () => {
      const requiredVars = ['RESEND_API_KEY', 'FROM_EMAIL'];
      const currentEnv = {
        RESEND_API_KEY: '',
        FROM_EMAIL: 'from@test.com'
      };

      const result = ConfigChecker.checkConfiguration(requiredVars, currentEnv);

      expect(result).toEqual({
        configured: false,
        missingVars: ['RESEND_API_KEY']
      });
    });
  });
});

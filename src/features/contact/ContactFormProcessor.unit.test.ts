import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactFormProcessor } from './ContactFormProcessor';
import { EmailService } from './EmailService';
import { TurnstileService } from './TurnstileService';
import { Result } from '@/shared/Result';
import { ValidationError, InternalServerError } from '@/shared/errors';

// Mock dependencies
vi.mock('./EmailService');
vi.mock('./TurnstileService');

describe('ContactFormProcessor', () => {
  let mockEmailService: any;
  let mockTurnstileService: any;

  const validFormData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@company.com',
    message: 'This is a valid test message that contains at least fifty characters to pass validation requirements'
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup email service mock
    mockEmailService = {
      sendContactEmail: vi.fn().mockResolvedValue(Result.success()),
      getConfiguration: vi.fn().mockReturnValue({ sendEmailEnabled: true })
    };

    // Setup turnstile service mock
    mockTurnstileService = {
      verifyToken: vi.fn().mockResolvedValue(Result.success())
    };

    // Mock static methods
    (EmailService.fromEnv as any) = vi.fn().mockReturnValue(Result.success(mockEmailService));
    (TurnstileService.fromEnv as any) = vi.fn().mockReturnValue(Result.success(mockTurnstileService));
    (TurnstileService.isEnabled as any) = vi.fn().mockReturnValue(true);
  });

  describe('fromEnv', () => {
    it('should create processor with both services when Turnstile is enabled', async () => {
      const result = await ContactFormProcessor.fromEnv();

      expect(result.success).toBe(true);
      expect(EmailService.fromEnv).toHaveBeenCalled();
      expect(TurnstileService.fromEnv).toHaveBeenCalled();
    });

    it('should create processor without Turnstile when disabled', async () => {
      (TurnstileService.isEnabled as any).mockReturnValue(false);

      const result = await ContactFormProcessor.fromEnv();

      expect(result.success).toBe(true);
      expect(EmailService.fromEnv).toHaveBeenCalled();
      expect(TurnstileService.fromEnv).not.toHaveBeenCalled();
    });

    it('should fail when email service initialization fails', async () => {
      const error = new InternalServerError('Email service error', {
        internalMessage: 'Email service initialization failed'
      });
      (EmailService.fromEnv as any).mockReturnValue(Result.failure(error));

      const result = await ContactFormProcessor.fromEnv();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Internal server error');
      }
    });

    it('should fail when Turnstile service initialization fails', async () => {
      const error = new InternalServerError('Turnstile config error', {
        internalMessage: 'Turnstile service initialization failed'
      });
      (TurnstileService.fromEnv as any).mockReturnValue(Result.failure(error));

      const result = await ContactFormProcessor.fromEnv();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(error);
      }
    });
  });

  describe('processForm', () => {
    let processor: ContactFormProcessor;

    beforeEach(() => {
      processor = new ContactFormProcessor(mockEmailService, mockTurnstileService);
    });

    it('should process form successfully with Turnstile token', async () => {
      const formDataWithToken = {
        ...validFormData,
        turnstileToken: 'test-token'
      };

      const result = await processor.processForm(formDataWithToken, '192.168.1.1');

      expect(result.success).toBe(true);
      expect(mockTurnstileService.verifyToken).toHaveBeenCalledWith('test-token', '192.168.1.1');
      expect(mockEmailService.sendContactEmail).toHaveBeenCalledWith(expect.objectContaining(validFormData));
    });

    it('should remove Turnstile token from form data before validation', async () => {
      const formDataWithToken = {
        ...validFormData,
        turnstileToken: 'test-token'
      };

      await processor.processForm(formDataWithToken);

      // Token should not be passed to email service
      const emailData = mockEmailService.sendContactEmail.mock.calls[0][0];
      expect(emailData).not.toHaveProperty('turnstileToken');
    });

    it('should fail when Turnstile is enabled but token is missing', async () => {
      const result = await processor.processForm(validFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification required');
        expect(result.error.internalMessage).toBe('Turnstile token is missing but Turnstile is enabled');
      }
      expect(mockEmailService.sendContactEmail).not.toHaveBeenCalled();
    });

    it('should fail when Turnstile verification fails', async () => {
      const verificationError = new ValidationError('Verification failed', {
        internalMessage: 'Turnstile token verification failed'
      });
      mockTurnstileService.verifyToken.mockResolvedValue(Result.failure(verificationError));

      const formDataWithToken = {
        ...validFormData,
        turnstileToken: 'invalid-token'
      };

      const result = await processor.processForm(formDataWithToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(verificationError);
      }
      expect(mockEmailService.sendContactEmail).not.toHaveBeenCalled();
    });

    it('should process form without Turnstile when service is not configured', async () => {
      processor = new ContactFormProcessor(mockEmailService); // No Turnstile service

      const result = await processor.processForm(validFormData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendContactEmail).toHaveBeenCalled();
    });

    it('should handle invalid form data', async () => {
      processor = new ContactFormProcessor(mockEmailService); // No Turnstile

      const invalidData = {
        firstName: 'J', // Too short
        lastName: '', // Missing
        email: 'invalid',
        message: 'Hi' // Too short
      };

      const result = await processor.processForm(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
      expect(mockEmailService.sendContactEmail).not.toHaveBeenCalled();
    });

    it('should skip email sending when disabled', async () => {
      mockEmailService.getConfiguration.mockReturnValue({ sendEmailEnabled: false });
      processor = new ContactFormProcessor(mockEmailService);

      const result = await processor.processForm(validFormData);

      expect(result.success).toBe(true);
      expect(mockEmailService.sendContactEmail).not.toHaveBeenCalled();
    });

    it('should handle email service errors', async () => {
      const emailError = new InternalServerError('Email failed', {
        internalMessage: 'Failed to send email'
      });
      mockEmailService.sendContactEmail.mockResolvedValue(Result.failure(emailError));
      processor = new ContactFormProcessor(mockEmailService);

      const result = await processor.processForm(validFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Failed to send message. Please try again later.');
      }
    });

    it('should handle null form data gracefully', async () => {
      processor = new ContactFormProcessor(mockEmailService);

      const result = await processor.processForm(null);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }
    });

    it('should extract Turnstile token from various data types', async () => {
      const testCases = [
        { turnstileToken: 'token1' },
        { turnstileToken: 123 }, // Should be ignored (not a string)
        { turnstileToken: null }, // Should be ignored
        { turnstileToken: undefined }, // Should be ignored
        {} // No token
      ];

      for (const testData of testCases) {
        const formData = { ...validFormData, ...testData };
        const result = await processor.processForm(formData);

        if (typeof testData.turnstileToken === 'string') {
          expect(mockTurnstileService.verifyToken).toHaveBeenCalledWith(testData.turnstileToken, undefined);
        } else {
          // Should fail due to missing token
          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.message).toBe('Security verification required');
          }
        }

        vi.clearAllMocks();
      }
    });
  });
});

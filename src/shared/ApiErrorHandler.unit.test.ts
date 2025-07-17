import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiErrorHandler } from './ApiErrorHandler';
import {
  ValidationError,
  RecaptchaError,
  SanitizationError,
  EmailServiceError,
  ServiceUnavailableError
} from './errors';
import { logger } from './Logger';
import type { NextApiResponse } from 'next';

vi.mock('./Logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

describe('ApiErrorHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  describe('mapErrorToResponse', () => {
    it('should map ValidationError to 400 status with details', () => {
      const error = new ValidationError('Please check your form data', 'Detailed validation error for logging', [
        { field: 'email', message: 'Required' }
      ]);
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Please check your form data');
      expect(result.response.errors).toEqual([{ field: 'email', message: 'Required' }]);
    });

    it('should map RecaptchaError to 400 status without details', () => {
      const error = new RecaptchaError(
        'Security verification failed',
        'reCAPTCHA API returned score 0.1, threshold 0.5'
      );
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Security verification failed');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map SanitizationError to 400 status with details', () => {
      const error = new SanitizationError(
        'Invalid content detected',
        'XSS attempt detected in message field: <script>alert(1)</script>',
        [{ field: 'message', message: 'Invalid content' }]
      );
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Invalid content detected');
      expect(result.response.errors).toEqual([{ field: 'message', message: 'Invalid content' }]);
    });

    it('should map EmailServiceError with isConfigError=true to 500 status', () => {
      const error = new EmailServiceError(
        'Unable to send messages at this time',
        'Missing RESEND_API_KEY environment variable',
        true
      );
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(500);
      expect(result.response.message).toBe('Unable to send messages at this time');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map EmailServiceError with isConfigError=false to 502 status', () => {
      const error = new EmailServiceError(
        'Unable to send your message at this time',
        'Resend API error: 422 Invalid email domain',
        false
      );
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(502);
      expect(result.response.message).toBe('Unable to send your message at this time');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map ServiceUnavailableError to 503 status', () => {
      const error = new ServiceUnavailableError(
        'Service temporarily unavailable',
        'Redis connection timeout after 5000ms',
        'redis'
      );
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(503);
      expect(result.response.message).toBe('Service temporarily unavailable');
      expect(result.response.errors).toBeUndefined();
    });
  });

  describe('handle', () => {
    it('should handle ValidationError: log internal details, send client message with errors', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new ValidationError(
        'Please check your form data',
        'Detailed validation error for backend: email field is required',
        [{ field: 'email', message: 'Required' }]
      );

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Please check your form data',
        errors: [{ field: 'email', message: 'Required' }]
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'VALIDATION_ERROR',
        category: 'client',
        clientMessage: 'Please check your form data',
        internalMessage: 'Detailed validation error for backend: email field is required',
        statusCode: 400,
        details: [{ field: 'email', message: 'Required' }]
      });
    });

    it('should handle RecaptchaError: log internal details, send client message without errors', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new RecaptchaError(
        'Security verification failed',
        'reCAPTCHA API returned score 0.1, threshold 0.5'
      );

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Security verification failed'
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'RECAPTCHA_ERROR',
        category: 'client',
        clientMessage: 'Security verification failed',
        internalMessage: 'reCAPTCHA API returned score 0.1, threshold 0.5',
        statusCode: 400,
        details: undefined
      });
    });

    it('should handle SanitizationError: log internal details, send client message with errors', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new SanitizationError(
        'Invalid content detected',
        'XSS attempt detected in message field: <script>alert(1)</script>',
        [{ field: 'message', message: 'Invalid content' }]
      );

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid content detected',
        errors: [{ field: 'message', message: 'Invalid content' }]
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'SANITIZATION_ERROR',
        category: 'client',
        clientMessage: 'Invalid content detected',
        internalMessage: 'XSS attempt detected in message field: <script>alert(1)</script>',
        statusCode: 400,
        details: [{ field: 'message', message: 'Invalid content' }]
      });
    });

    it('should handle EmailServiceError (config): log internal details, send client message', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new EmailServiceError(
        'Unable to send messages at this time',
        'Missing RESEND_API_KEY environment variable',
        true
      );

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unable to send messages at this time'
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'EMAIL_SERVICE_ERROR',
        category: 'server',
        clientMessage: 'Unable to send messages at this time',
        internalMessage: 'Missing RESEND_API_KEY environment variable',
        statusCode: 500,
        details: undefined
      });
    });

    it('should handle EmailServiceError (runtime): log internal details, send client message', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new EmailServiceError(
        'Unable to send your message at this time',
        'Resend API returned 422: Invalid email domain verification required',
        false
      );

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(502);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Unable to send your message at this time'
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'EMAIL_SERVICE_ERROR',
        category: 'server',
        clientMessage: 'Unable to send your message at this time',
        internalMessage: 'Resend API returned 422: Invalid email domain verification required',
        statusCode: 502,
        details: undefined
      });
    });

    it('should handle ServiceUnavailableError: log internal details, send client message', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new ServiceUnavailableError(
        'Service temporarily unavailable',
        'Redis connection timeout after 5000ms',
        'redis'
      );

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Service temporarily unavailable'
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'SERVICE_UNAVAILABLE',
        category: 'external',
        clientMessage: 'Service temporarily unavailable',
        internalMessage: 'Redis connection timeout after 5000ms',
        statusCode: 503,
        details: undefined
      });
    });
  });
});

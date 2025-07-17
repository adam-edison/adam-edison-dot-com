import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiErrorHandler } from './ApiErrorHandler';
import {
  ValidationError,
  RecaptchaError,
  SanitizationError,
  EmailServiceError,
  ServiceUnavailableError,
  RateLimitError,
  MethodNotAllowedError,
  InternalServerError
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
      const error = new ValidationError('Please check your form data', {
        internalMessage: 'Detailed validation error for logging',
        details: [{ field: 'email', message: 'Required' }]
      });
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Please check your form data');
      expect(result.response.errors).toEqual([{ field: 'email', message: 'Required' }]);
    });

    it('should map RecaptchaError to 400 status without details', () => {
      const error = new RecaptchaError('Security verification failed', {
        internalMessage: 'reCAPTCHA API returned score 0.1, threshold 0.5'
      });
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Security verification failed');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map SanitizationError to 400 status with details', () => {
      const error = new SanitizationError('Invalid content detected', {
        internalMessage: 'XSS attempt detected in message field: <script>alert(1)</script>',
        details: [{ field: 'message', message: 'Invalid content' }]
      });
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Invalid content detected');
      expect(result.response.errors).toEqual([{ field: 'message', message: 'Invalid content' }]);
    });

    it('should map EmailServiceError with isConfigError=true to 500 status', () => {
      const error = new EmailServiceError('Unable to send messages at this time', {
        internalMessage: 'Missing RESEND_API_KEY environment variable',
        isConfigError: true
      });
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(500);
      expect(result.response.message).toBe('Unable to send messages at this time');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map EmailServiceError with isConfigError=false to 502 status', () => {
      const error = new EmailServiceError('Unable to send your message at this time', {
        internalMessage: 'Resend API error: 422 Invalid email domain',
        isConfigError: false
      });
      const result = ApiErrorHandler.mapErrorToResponse(error);

      expect(result.statusCode).toBe(502);
      expect(result.response.message).toBe('Unable to send your message at this time');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map ServiceUnavailableError to 503 status', () => {
      const error = new ServiceUnavailableError('Service temporarily unavailable', {
        internalMessage: 'Redis connection timeout after 5000ms',
        serviceName: 'redis'
      });
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

      const error = new ValidationError('Please check your form data', {
        internalMessage: 'Detailed validation error for backend: email field is required',
        details: [{ field: 'email', message: 'Required' }]
      });

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
        details: [{ field: 'email', message: 'Required' }],
        metadata: undefined
      });
    });

    it('should handle RecaptchaError: log internal details, send client message without errors', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new RecaptchaError('Security verification failed', {
        internalMessage: 'reCAPTCHA API returned score 0.1, threshold 0.5'
      });

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
        details: undefined,
        metadata: undefined
      });
    });

    it('should handle SanitizationError: log internal details, send client message with errors', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new SanitizationError('Invalid content detected', {
        internalMessage: 'XSS attempt detected in message field: <script>alert(1)</script>',
        details: [{ field: 'message', message: 'Invalid content' }]
      });

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
        details: [{ field: 'message', message: 'Invalid content' }],
        metadata: undefined
      });
    });

    it('should handle EmailServiceError (config): log internal details, send client message', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new EmailServiceError('Unable to send messages at this time', {
        internalMessage: 'Missing RESEND_API_KEY environment variable',
        isConfigError: true
      });

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
        details: undefined,
        metadata: undefined
      });
    });

    it('should handle EmailServiceError (runtime): log internal details, send client message', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new EmailServiceError('Unable to send your message at this time', {
        internalMessage: 'Resend API returned 422: Invalid email domain verification required',
        isConfigError: false
      });

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
        details: undefined,
        metadata: undefined
      });
    });

    it('should handle ServiceUnavailableError: log internal details, send client message', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new ServiceUnavailableError('Service temporarily unavailable', {
        internalMessage: 'Redis connection timeout after 5000ms',
        serviceName: 'redis'
      });

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
        details: undefined,
        metadata: undefined
      });
    });

    it('should handle RateLimitError: log internal details, send client message with retryAfter', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new RateLimitError('Too many requests. Please try again later.', {
        internalMessage: 'IP rate limit exceeded: 5 requests per 10 minutes from 192.168.1.1',
        retryAfter: 300,
        limitType: 'ip'
      });

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Too many requests. Please try again later.',
        retryAfter: 300
        // limitType is no longer exposed to client - kept in internal metadata only
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'RATE_LIMIT_ERROR',
        category: 'client',
        clientMessage: 'Too many requests. Please try again later.',
        internalMessage: 'IP rate limit exceeded: 5 requests per 10 minutes from 192.168.1.1',
        statusCode: 429,
        details: undefined,
        metadata: { limitType: 'ip', actualLimitValue: 300 }
      });
    });

    it('should handle MethodNotAllowedError: log internal details, send client message with Allow header', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        setHeader: vi.fn()
      } as unknown as NextApiResponse;

      const error = new MethodNotAllowedError('Method not allowed', {
        internalMessage: 'Invalid method GET, expected POST',
        allowedMethod: 'POST',
        attemptedMethod: 'GET'
      });

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Method not allowed'
        // allowedMethod is no longer in response body - it's in Allow header and internal metadata only
      });

      // Verify Allow header is set
      expect(mockRes.setHeader).toHaveBeenCalledWith('Allow', 'POST');

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'METHOD_NOT_ALLOWED',
        category: 'client',
        clientMessage: 'Method not allowed',
        internalMessage: 'Invalid method GET, expected POST',
        statusCode: 405,
        details: undefined,
        metadata: { allowedMethod: 'POST', attemptedMethod: 'GET' }
      });
    });

    it('should handle InternalServerError: log internal details, send client message', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new InternalServerError('Internal server error', {
        internalMessage: 'Failed to create ContactFormProcessor: Database connection failed'
      });

      ApiErrorHandler.handle(mockRes, error);

      // Verify HTTP response
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });

      // Verify logging
      expect(logger.error).toHaveBeenCalledWith('API Error:', {
        code: 'INTERNAL_SERVER_ERROR',
        category: 'server',
        clientMessage: 'Internal server error',
        internalMessage: 'Failed to create ContactFormProcessor: Database connection failed',
        statusCode: 500,
        details: undefined,
        metadata: undefined
      });
    });
  });
});

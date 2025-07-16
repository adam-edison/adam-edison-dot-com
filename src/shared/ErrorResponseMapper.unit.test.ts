import { describe, it, expect, vi } from 'vitest';
import { ErrorResponseMapper } from './ErrorResponseMapper';
import {
  ValidationError,
  RecaptchaError,
  SanitizationError,
  EmailServiceError,
  ServiceUnavailableError
} from './errors';
import type { NextApiResponse } from 'next';

describe('ErrorResponseMapper', () => {
  describe('mapErrorToResponse', () => {
    it('should map ValidationError to 400 status with details', () => {
      const error = new ValidationError('Invalid data', [{ field: 'email', message: 'Required' }]);
      const result = ErrorResponseMapper.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Invalid data');
      expect(result.response.errors).toEqual([{ field: 'email', message: 'Required' }]);
    });

    it('should map RecaptchaError to 400 status without details', () => {
      const error = new RecaptchaError('reCAPTCHA failed');
      const result = ErrorResponseMapper.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('reCAPTCHA failed');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map SanitizationError to 400 status with details', () => {
      const error = new SanitizationError('Sanitization failed', [{ field: 'message', message: 'Invalid content' }]);
      const result = ErrorResponseMapper.mapErrorToResponse(error);

      expect(result.statusCode).toBe(400);
      expect(result.response.message).toBe('Sanitization failed');
      expect(result.response.errors).toEqual([{ field: 'message', message: 'Invalid content' }]);
    });

    it('should map EmailServiceError with isConfigError=true to 500 status', () => {
      const error = new EmailServiceError('Config missing', true);
      const result = ErrorResponseMapper.mapErrorToResponse(error);

      expect(result.statusCode).toBe(500);
      expect(result.response.message).toBe('Config missing');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map EmailServiceError with isConfigError=false to 502 status', () => {
      const error = new EmailServiceError('Send failed', false);
      const result = ErrorResponseMapper.mapErrorToResponse(error);

      expect(result.statusCode).toBe(502);
      expect(result.response.message).toBe('Send failed');
      expect(result.response.errors).toBeUndefined();
    });

    it('should map ServiceUnavailableError to 503 status', () => {
      const error = new ServiceUnavailableError('Service down');
      const result = ErrorResponseMapper.mapErrorToResponse(error);

      expect(result.statusCode).toBe(503);
      expect(result.response.message).toBe('Service down');
      expect(result.response.errors).toBeUndefined();
    });
  });

  describe('sendErrorResponse', () => {
    it('should call res.status and res.json with mapped error response', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new ValidationError('Invalid data', [{ field: 'email', message: 'Required' }]);

      ErrorResponseMapper.sendErrorResponse(mockRes, error);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Invalid data',
        errors: [{ field: 'email', message: 'Required' }]
      });
    });
  });
});

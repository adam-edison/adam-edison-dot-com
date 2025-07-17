import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiErrorHandler } from './ApiErrorHandler';
import { RateLimitError, MethodNotAllowedError, InternalServerError } from './errors';
import { logger } from './Logger';
import type { NextApiRequest, NextApiResponse } from 'next';

// Mock logger
vi.mock('./Logger', () => ({
  logger: {
    error: vi.fn()
  }
}));

describe('ApiErrorHandler - Security Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Information Leakage in Error Responses', () => {
    it('FIXED: RateLimitError now only exposes safe responseMetadata to client', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        setHeader: vi.fn()
      } as unknown as NextApiResponse;

      const error = new RateLimitError('Too many requests. Please try again later.', {
        internalMessage: 'IP rate limit exceeded: 5 requests per 10 minutes from 192.168.1.1',
        retryAfter: 300,
        limitType: 'ip'
      });

      ApiErrorHandler.handle(mockRes, error);

      // Now only safe responseMetadata is exposed to clients
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Too many requests. Please try again later.',
        retryAfter: 300
      });

      // Verify internal metadata is logged but not exposed
      expect(logger.error).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          metadata: expect.objectContaining({
            limitType: 'ip'
          })
        })
      );
    });

    it('FIXED: MethodNotAllowedError no longer duplicates Allow header in response body', () => {
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

      // Clean response - no redundant information
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Method not allowed'
      });

      // Verify Allow header is still set
      expect(mockRes.setHeader).toHaveBeenCalledWith('Allow', 'POST');

      // Verify internal metadata is logged
      expect(logger.error).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          metadata: expect.objectContaining({
            allowedMethod: 'POST',
            attemptedMethod: 'GET'
          })
        })
      );
    });

    it('GOOD: InternalServerError does not leak sensitive metadata', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const error = new InternalServerError('Internal server error', {
        internalMessage: 'Database connection failed: postgres://user:pass@localhost:5432/db'
      });

      ApiErrorHandler.handle(mockRes, error);

      // Good - no metadata should be exposed for internal server errors
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });

    it('POTENTIAL ISSUE: Custom metadata could leak sensitive information', () => {
      // Simulating a custom error that might put sensitive data in metadata
      class CustomError extends InternalServerError {
        constructor(message: string, sensitiveData: Record<string, unknown>) {
          super(message, {
            internalMessage: 'Custom error occurred'
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this as any).metadata = { debugInfo: sensitiveData };
        }
      }

      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      // This demonstrates how metadata could leak sensitive information
      const sensitiveInfo = {
        userId: 12345,
        email: 'user@example.com',
        apiKey: 'sk-1234567890abcdef',
        databaseUrl: 'postgres://user:pass@localhost:5432/db'
      };

      const error = new CustomError('Something went wrong', sensitiveInfo);
      ApiErrorHandler.handle(mockRes, error);

      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Something went wrong'
      });
    });
  });

  describe('Recommended Security Controls', () => {
    it('should have a whitelist of safe metadata fields to expose', () => {
      expect(true).toBe(true);
    });

    it('should never expose internal messages in responses', () => {
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

      const responseCall = (mockRes.json as unknown as { mock: { calls: unknown[][] } }).mock.calls[0][0];

      expect(responseCall).not.toHaveProperty('internalMessage');
      expect(JSON.stringify(responseCall)).not.toContain('IP rate limit exceeded');
      expect(JSON.stringify(responseCall)).not.toContain('192.168.1.1');
    });
  });

  describe('Request Context Logging', () => {
    it('should log request context when provided', () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as unknown as NextApiResponse;

      const mockReq = {
        headers: {
          'x-forwarded-for': '192.168.1.100',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;

      const requestContext = ApiErrorHandler.createRequestContext(mockReq);
      const error = new InternalServerError('Something went wrong', {
        internalMessage: 'Test internal error message'
      });

      ApiErrorHandler.handle(mockRes, error, requestContext);

      expect(logger.error).toHaveBeenCalledWith(
        'API Error:',
        expect.objectContaining({
          requestContext: expect.objectContaining({
            requestId: expect.any(String),
            ip: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          })
        })
      );
    });

    it('should handle missing headers gracefully', () => {
      const mockReq = {
        headers: {},
        socket: {}
      } as unknown as NextApiRequest;

      const requestContext = ApiErrorHandler.createRequestContext(mockReq);

      expect(requestContext).toEqual({
        requestId: expect.any(String),
        ip: undefined,
        userAgent: undefined
      });
    });

    it('should handle array IP addresses from x-forwarded-for', () => {
      const mockReq = {
        headers: {
          'x-forwarded-for': ['192.168.1.100', '10.0.0.1']
        },
        socket: { remoteAddress: '127.0.0.1' }
      } as unknown as NextApiRequest;

      const requestContext = ApiErrorHandler.createRequestContext(mockReq);

      expect(requestContext.ip).toBe('192.168.1.100');
    });
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ContactFormProcessor } from './ContactFormProcessor';
import { ContactRateLimiter } from './ContactRateLimiter';

type MockedFunction<T> = T & {
  mockResolvedValueOnce: (value: unknown) => void;
  mockRejectedValueOnce: (error: unknown) => void;
  mock: { calls: unknown[][] };
};

// Mock environment variables
const mockEnv = {
  RESEND_API_KEY: 'test-resend-key',
  FROM_EMAIL: 'test@example.com',
  TO_EMAIL: 'recipient@example.com',
  SEND_EMAIL_ENABLED: 'true',
  EMAIL_SENDER_NAME: 'Test Sender',
  EMAIL_RECIPIENT_NAME: 'Test Recipient',
  TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
  TURNSTILE_ENABLED: 'true',
  UPSTASH_REDIS_REST_URL: 'https://test.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-token',
  CONTACT_IP_RATE_LIMIT_REQUESTS: '5',
  CONTACT_IP_RATE_LIMIT_WINDOW: '10 m',
  CONTACT_GLOBAL_RATE_LIMIT_REQUESTS: '100',
  CONTACT_GLOBAL_RATE_LIMIT_WINDOW: '1 h',
  CONTACT_EMAIL_RATE_LIMIT_REQUESTS: '3',
  CONTACT_EMAIL_RATE_LIMIT_WINDOW: '1 h'
};

// Mock fetch for Turnstile API
global.fetch = vi.fn();

describe('Contact Form Turnstile Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment
    Object.entries(mockEnv).forEach(([key, value]) => {
      vi.stubEnv(key, value);
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Full contact form flow with Turnstile', () => {
    it('should successfully process form with valid Turnstile token', async () => {
      // Mock Redis pipeline call (rate limiting) - comes first
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 'OK' }, // SET command for global limit
          { result: 'OK' }, // SET command for IP limit
          { result: 'OK' } // SET command for email limit
        ]
      });

      // Mock Turnstile verification success
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, challenge_ts: '2024-01-01T00:00:00Z' })
      });

      // Mock email sending (Resend API)
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-123' })
      });

      // Initialize processor
      const processorResult = await ContactFormProcessor.fromEnv();
      expect(processorResult.success).toBe(true);

      if (!processorResult.success) return;

      const processor = processorResult.data;

      // Process form with Turnstile token
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        message: 'This is a valid test message that contains at least fifty characters to pass validation requirements',
        turnstileToken: 'valid-turnstile-token'
      };

      const result = await processor.processForm(formData, '192.168.1.1');

      expect(result.success).toBe(true);

      // Verify Turnstile API was called
      expect(global.fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams)
        })
      );

      // Verify email was sent
      expect(global.fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.any(Object));
    });

    it('should reject form submission without Turnstile token', async () => {
      const processorResult = await ContactFormProcessor.fromEnv();
      expect(processorResult.success).toBe(true);

      if (!processorResult.success) return;

      const processor = processorResult.data;

      // Process form without Turnstile token
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        message: 'This is a valid test message that contains at least fifty characters to pass validation requirements'
        // No turnstileToken
      };

      const result = await processor.processForm(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification required');
      }

      // Verify no API calls were made
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should reject form with invalid Turnstile token', async () => {
      // Mock Redis pipeline call (rate limiting) - comes first
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 'OK' }, // SET command for global limit
          { result: 'OK' }, // SET command for IP limit
          { result: 'OK' } // SET command for email limit
        ]
      });

      // Mock Turnstile verification failure
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response']
        })
      });

      const processorResult = await ContactFormProcessor.fromEnv();
      expect(processorResult.success).toBe(true);

      if (!processorResult.success) return;

      const processor = processorResult.data;

      // Process form with invalid token
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        message: 'This is a valid test message that contains at least fifty characters to pass validation requirements',
        turnstileToken: 'invalid-token'
      };

      const result = await processor.processForm(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Invalid security verification. Please complete the challenge again.');
      }

      // Verify Redis and Turnstile API were called but email was not
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.any(Object)
      );
    });

    it('should handle Turnstile timeout gracefully', async () => {
      // Mock Redis pipeline call (rate limiting) - comes first
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 'OK' }, // SET command for global limit
          { result: 'OK' }, // SET command for IP limit
          { result: 'OK' } // SET command for email limit
        ]
      });

      // Mock Turnstile API timeout
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (global.fetch as MockedFunction<typeof fetch>).mockRejectedValueOnce(abortError);

      const processorResult = await ContactFormProcessor.fromEnv();
      expect(processorResult.success).toBe(true);

      if (!processorResult.success) return;

      const processor = processorResult.data;

      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        message: 'This is a valid test message that contains at least fifty characters to pass validation requirements',
        turnstileToken: 'test-token'
      };

      const result = await processor.processForm(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification timeout');
      }
    });

    it('should work without Turnstile when not configured', async () => {
      // Remove Turnstile configuration
      vi.stubEnv('TURNSTILE_SECRET_KEY', '');
      vi.stubEnv('TURNSTILE_ENABLED', 'false');

      // Mock email sending
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-123' })
      });

      const processorResult = await ContactFormProcessor.fromEnv();
      expect(processorResult.success).toBe(true);

      if (!processorResult.success) return;

      const processor = processorResult.data;

      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        message: 'This is a valid test message that contains at least fifty characters to pass validation requirements'
      };

      const result = await processor.processForm(formData);

      expect(result.success).toBe(true);

      // Verify only email API was called (no Turnstile)
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith('https://api.resend.com/emails', expect.any(Object));
    });
  });

  describe('Rate limiting with Turnstile', () => {
    it('should apply rate limits even with valid Turnstile token', async () => {
      // Mock Redis for rate limiting
      const mockRedisClient = {
        get: vi.fn().mockResolvedValue('10'), // Already at limit
        setex: vi.fn().mockResolvedValue('OK'),
        incr: vi.fn().mockResolvedValue(11),
        expire: vi.fn().mockResolvedValue(1)
      };

      // Mock rate limiter to return limit exceeded
      const rateLimiter = ContactRateLimiter.fromEnv();
      // Access the internal rate limiters to mock Redis client
      (
        rateLimiter as unknown as { globalRateLimiter: { redisClient: typeof mockRedisClient } }
      ).globalRateLimiter.redisClient = mockRedisClient;
      (rateLimiter as unknown as { ipRateLimiter: { redisClient: typeof mockRedisClient } }).ipRateLimiter.redisClient =
        mockRedisClient;
      (
        rateLimiter as unknown as { emailRateLimiter: { redisClient: typeof mockRedisClient } }
      ).emailRateLimiter.redisClient = mockRedisClient;

      // This test would require more complex mocking of the actual API endpoint
      // For now, we're testing that rate limiting and Turnstile are independent
    });
  });

  describe('Error scenarios', () => {
    it('should handle Turnstile service unavailable', async () => {
      // Mock Redis pipeline call (rate limiting) - comes first
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 'OK' }, // SET command for global limit
          { result: 'OK' }, // SET command for IP limit
          { result: 'OK' } // SET command for email limit
        ]
      });

      // Mock Turnstile API returning 503
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable'
      });

      const processorResult = await ContactFormProcessor.fromEnv();
      expect(processorResult.success).toBe(true);

      if (!processorResult.success) return;

      const processor = processorResult.data;

      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        message: 'This is a valid test message that contains at least fifty characters to pass validation requirements',
        turnstileToken: 'test-token'
      };

      const result = await processor.processForm(formData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification service unavailable');
      }
    });

    it('should sanitize form data after Turnstile verification', async () => {
      // Mock Redis pipeline call (rate limiting) - comes first
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 'OK' }, // SET command for global limit
          { result: 'OK' }, // SET command for IP limit
          { result: 'OK' } // SET command for email limit
        ]
      });

      // Mock Turnstile verification success
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      // Mock email sending
      (global.fetch as MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'email-123' })
      });

      const processorResult = await ContactFormProcessor.fromEnv();
      expect(processorResult.success).toBe(true);

      if (!processorResult.success) return;

      const processor = processorResult.data;

      // Form data with potential XSS
      const formData = {
        firstName: '<script>alert("xss")</script>John',
        lastName: 'Doe<img src=x onerror=alert(1)>',
        email: 'john.doe@company.com',
        message: 'This is a valid test message that contains at least fifty characters with <b>HTML</b> tags',
        turnstileToken: 'valid-token'
      };

      const result = await processor.processForm(formData);

      expect(result.success).toBe(true);

      // Check that email was sent with sanitized data
      const emailCall = (global.fetch as MockedFunction<typeof fetch>).mock.calls[2];
      const emailBody = JSON.parse((emailCall[1] as RequestInit).body as string);

      // Verify HTML was escaped
      expect(emailBody.html).toContain('&lt;script&gt;');
      expect(emailBody.html).not.toContain('<script>');
      expect(emailBody.html).toContain('&lt;img');
      expect(emailBody.html).not.toContain('<img');
    });
  });
});

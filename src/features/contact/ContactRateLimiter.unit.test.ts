import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContactRateLimiter } from './ContactRateLimiter';
import { Result } from '@/shared/Result';

// Mock the RateLimiter class
const mockGlobalLimiter = {
  checkLimit: vi.fn(),
  clearKeys: vi.fn()
};

const mockIpLimiter = {
  checkLimit: vi.fn(),
  clearKeys: vi.fn()
};

const mockEmailLimiter = {
  checkLimit: vi.fn(),
  clearKeys: vi.fn()
};

vi.mock('@/features/rate-limiting/RateLimiter', () => ({
  RateLimiter: {
    fromEnv: vi.fn((config) => {
      if (config.limitType === 'global') return mockGlobalLimiter;
      if (config.limitType === 'ip') return mockIpLimiter;
      if (config.limitType === 'email') return mockEmailLimiter;
      return mockGlobalLimiter;
    })
  }
}));

describe('ContactRateLimiter', () => {
  let rateLimiter: ContactRateLimiter;
  const testIp = '192.168.1.1';
  const testEmail = 'test@example.com';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock environment variables
    vi.stubEnv('CONTACT_GLOBAL_RATE_LIMIT_REQUESTS', '10');
    vi.stubEnv('CONTACT_GLOBAL_RATE_LIMIT_WINDOW', '1 h');
    vi.stubEnv('CONTACT_IP_RATE_LIMIT_REQUESTS', '5');
    vi.stubEnv('CONTACT_IP_RATE_LIMIT_WINDOW', '10 m');

    rateLimiter = ContactRateLimiter.fromEnv();

    // Default: all limits pass
    mockGlobalLimiter.checkLimit.mockResolvedValue(Result.success({ headers: { 'x-global-limit': '10' } }));
    mockIpLimiter.checkLimit.mockResolvedValue(Result.success({ headers: { 'x-ip-limit': '5' } }));
    mockEmailLimiter.checkLimit.mockResolvedValue(Result.success({ headers: { 'x-email-limit': '3' } }));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('checkLimits', () => {
    it('should pass when all limits are within bounds (IP only)', async () => {
      const result = await rateLimiter.checkLimits(testIp);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headers).toEqual({
          'x-global-limit': '10',
          'x-ip-limit': '5'
        });
      }
      expect(mockGlobalLimiter.checkLimit).toHaveBeenCalledWith('global');
      expect(mockIpLimiter.checkLimit).toHaveBeenCalledWith(testIp);
      expect(mockEmailLimiter.checkLimit).not.toHaveBeenCalled();
    });

    it('should include email rate limiting when valid email is provided', async () => {
      const result = await rateLimiter.checkLimits(testIp, testEmail);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.headers).toEqual({
          'x-global-limit': '10',
          'x-ip-limit': '5',
          'x-email-limit': '3'
        });
      }
      expect(mockEmailLimiter.checkLimit).toHaveBeenCalledWith(testEmail);
    });

    it('should normalize Gmail addresses for rate limiting', async () => {
      const gmailWithDots = 'test.user+alias@gmail.com';
      await rateLimiter.checkLimits(testIp, gmailWithDots);

      expect(mockEmailLimiter.checkLimit).toHaveBeenCalledWith('testuser@gmail.com');
    });

    it('should normalize regular email addresses (lowercase)', async () => {
      const upperCaseEmail = 'TEST.User@Example.COM';
      await rateLimiter.checkLimits(testIp, upperCaseEmail);

      expect(mockEmailLimiter.checkLimit).toHaveBeenCalledWith('test.user@example.com');
    });

    it('should skip email rate limiting for invalid emails', async () => {
      const invalidEmail = 'not-an-email';
      const result = await rateLimiter.checkLimits(testIp, invalidEmail);

      expect(result.success).toBe(true);
      expect(mockEmailLimiter.checkLimit).not.toHaveBeenCalled();
    });

    it('should fail when global rate limit is exceeded', async () => {
      const rateLimitError = new Error('Global rate limit exceeded');
      mockGlobalLimiter.checkLimit.mockResolvedValue(Result.failure(rateLimitError));

      const result = await rateLimiter.checkLimits(testIp, testEmail);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(rateLimitError);
      }
    });

    it('should fail when IP rate limit is exceeded', async () => {
      const rateLimitError = new Error('IP rate limit exceeded');
      mockIpLimiter.checkLimit.mockResolvedValue(Result.failure(rateLimitError));

      const result = await rateLimiter.checkLimits(testIp, testEmail);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(rateLimitError);
      }
    });

    it('should fail when email rate limit is exceeded', async () => {
      const rateLimitError = new Error('Email rate limit exceeded');
      mockEmailLimiter.checkLimit.mockResolvedValue(Result.failure(rateLimitError));

      const result = await rateLimiter.checkLimits(testIp, testEmail);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(rateLimitError);
      }
    });

    it('should prioritize global over IP over email errors', async () => {
      const globalError = new Error('Global error');
      const ipError = new Error('IP error');
      const emailError = new Error('Email error');

      mockGlobalLimiter.checkLimit.mockResolvedValue(Result.failure(globalError));
      mockIpLimiter.checkLimit.mockResolvedValue(Result.failure(ipError));
      mockEmailLimiter.checkLimit.mockResolvedValue(Result.failure(emailError));

      const result = await rateLimiter.checkLimits(testIp, testEmail);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe(globalError);
      }
    });
  });

  describe('clearKeys', () => {
    it('should clear keys for all rate limiters', async () => {
      const pattern = 'test:*';
      await rateLimiter.clearKeys(pattern);

      expect(mockGlobalLimiter.clearKeys).toHaveBeenCalledWith(pattern);
      expect(mockIpLimiter.clearKeys).toHaveBeenCalledWith(pattern);
      expect(mockEmailLimiter.clearKeys).toHaveBeenCalledWith(pattern);
    });
  });

  describe('email validation and normalization', () => {
    it('should detect valid emails', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'user+tag@example.org'];

      for (const email of validEmails) {
        const result = await rateLimiter.checkLimits(testIp, email);
        expect(result.success).toBe(true);
        expect(mockEmailLimiter.checkLimit).toHaveBeenCalledWith(expect.any(String));
      }
    });

    it('should reject invalid emails', async () => {
      const invalidEmails = [
        'notanemail',
        '@domain.com',
        'user@',
        'user@.com',
        'user space@domain.com',
        'a'.repeat(255) + '@domain.com' // Too long
      ];

      for (const email of invalidEmails) {
        vi.clearAllMocks();
        const result = await rateLimiter.checkLimits(testIp, email);
        expect(result.success).toBe(true);
        expect(mockEmailLimiter.checkLimit).not.toHaveBeenCalled();
      }
    });

    it('should normalize Gmail addresses correctly', () => {
      // Test cases for Gmail normalization
      const testCases = [
        { input: 'test.user@gmail.com', expected: 'testuser@gmail.com' },
        { input: 'Test.User+alias@gmail.com', expected: 'testuser@gmail.com' },
        { input: 't.e.s.t+multiple+plus@gmail.com', expected: 'test@gmail.com' },
        { input: 'user@other.com', expected: 'user@other.com' },
        { input: 'User.Name@Other.COM', expected: 'user.name@other.com' }
      ];

      testCases.forEach(({ input, expected }) => {
        // Use the private method through a workaround
        const normalizeEmail = (rateLimiter as { normalizeEmail: (email: string) => string }).normalizeEmail.bind(
          rateLimiter
        );
        expect(normalizeEmail(input)).toBe(expected);
      });
    });
  });
});

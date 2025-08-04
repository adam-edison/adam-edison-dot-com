import { expect, test, describe, vi, beforeEach } from 'vitest';
import { ContactFormService } from './ContactFormService';
import { ContactFormData } from './ContactFormValidator';
import { Result } from '@/shared/Result';

const mockFormData: ContactFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  message: 'This is a test message that meets the minimum character requirement for testing purposes.'
};

describe('ContactFormService', () => {
  let contactService: ContactFormService;
  let mockEmailService: {
    send: ReturnType<typeof vi.fn>;
  };
  let mockSecurityService: {
    getTokens: ReturnType<typeof vi.fn>;
    refreshCsrfToken: ReturnType<typeof vi.fn>;
    resetTokens: ReturnType<typeof vi.fn>;
  };
  let mockConfigService: {
    getServiceConfig: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockEmailService = {
      send: vi.fn()
    };

    mockSecurityService = {
      getTokens: vi.fn(),
      refreshCsrfToken: vi.fn(),
      resetTokens: vi.fn()
    };

    mockConfigService = {
      getServiceConfig: vi.fn()
    };

    contactService = new ContactFormService(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockEmailService as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockSecurityService as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockConfigService as any
    );
  });

  describe('getConfig', () => {
    test('should delegate to ConfigService', async () => {
      const mockConfig = {
        status: 'healthy' as const,
        services: {
          email: { enabled: true, ready: true },
          turnstile: { enabled: false, ready: false }
        }
      };

      vi.mocked(mockConfigService.getServiceConfig).mockResolvedValue(Result.success(mockConfig));

      const result = await contactService.getConfig();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockConfig);
      }
      expect(mockConfigService.getServiceConfig).toHaveBeenCalledOnce();
    });

    test('should return failure when ConfigService fails', async () => {
      vi.mocked(mockConfigService.getServiceConfig).mockResolvedValue(Result.failure('Config service error'));

      const result = await contactService.getConfig();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Config service error');
      }
    });
  });

  describe('submit', () => {
    test('should submit successfully on first attempt', async () => {
      const mockTokens = { csrfToken: 'csrf-token', turnstileToken: 'turnstile-token' };

      vi.mocked(mockSecurityService.getTokens).mockResolvedValue(Result.success(mockTokens));
      vi.mocked(mockEmailService.send).mockResolvedValue(Result.success());

      const result = await contactService.submit(mockFormData);

      expect(result.success).toBe(true);
      expect(mockSecurityService.getTokens).toHaveBeenCalledOnce();
      expect(mockEmailService.send).toHaveBeenCalledWith(mockFormData, mockTokens);
      expect(mockSecurityService.resetTokens).toHaveBeenCalledOnce();
    });

    test('should return failure when getTokens fails', async () => {
      vi.mocked(mockSecurityService.getTokens).mockResolvedValue(Result.failure('Failed to get tokens'));

      const result = await contactService.submit(mockFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to get tokens');
      }
      expect(mockEmailService.send).not.toHaveBeenCalled();
    });

    test('should retry on CSRF error', async () => {
      const mockTokens = { csrfToken: 'csrf-token' };
      const mockFreshTokens = { csrfToken: 'fresh-csrf-token' };

      // First attempt fails with CSRF error
      vi.mocked(mockSecurityService.getTokens)
        .mockResolvedValueOnce(Result.success(mockTokens))
        .mockResolvedValueOnce(Result.success(mockFreshTokens));

      vi.mocked(mockEmailService.send)
        .mockResolvedValueOnce(Result.failure('403 Forbidden - CSRF token invalid'))
        .mockResolvedValueOnce(Result.success());

      vi.mocked(mockSecurityService.refreshCsrfToken).mockResolvedValue(Result.success('fresh-csrf-token'));

      const result = await contactService.submit(mockFormData);

      expect(result.success).toBe(true);
      expect(mockSecurityService.refreshCsrfToken).toHaveBeenCalledOnce();
      expect(mockSecurityService.getTokens).toHaveBeenCalledTimes(2);
      expect(mockEmailService.send).toHaveBeenCalledTimes(2);
      expect(mockSecurityService.resetTokens).toHaveBeenCalledOnce();
    });

    test('should not retry on non-CSRF errors', async () => {
      const mockTokens = { csrfToken: 'csrf-token' };

      vi.mocked(mockSecurityService.getTokens).mockResolvedValue(Result.success(mockTokens));
      vi.mocked(mockEmailService.send).mockResolvedValue(Result.failure('Rate limit exceeded'));

      const result = await contactService.submit(mockFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Rate limit exceeded');
      }
      expect(mockSecurityService.refreshCsrfToken).not.toHaveBeenCalled();
      expect(mockEmailService.send).toHaveBeenCalledOnce();
      expect(mockSecurityService.resetTokens).not.toHaveBeenCalled();
    });

    test('should handle refresh token failure', async () => {
      const mockTokens = { csrfToken: 'csrf-token' };

      vi.mocked(mockSecurityService.getTokens).mockResolvedValue(Result.success(mockTokens));
      vi.mocked(mockEmailService.send).mockResolvedValue(Result.failure('403 Forbidden'));
      vi.mocked(mockSecurityService.refreshCsrfToken).mockResolvedValue(Result.failure('Failed to refresh token'));

      const result = await contactService.submit(mockFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('403 Forbidden');
      }
      expect(mockSecurityService.refreshCsrfToken).toHaveBeenCalledOnce();
    });

    test('should handle fresh token retrieval failure', async () => {
      const mockTokens = { csrfToken: 'csrf-token' };

      vi.mocked(mockSecurityService.getTokens)
        .mockResolvedValueOnce(Result.success(mockTokens))
        .mockResolvedValueOnce(Result.failure('Failed to get fresh tokens'));

      vi.mocked(mockEmailService.send).mockResolvedValue(Result.failure('403 Forbidden'));
      vi.mocked(mockSecurityService.refreshCsrfToken).mockResolvedValue(Result.success('fresh-token'));

      const result = await contactService.submit(mockFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to get fresh tokens');
      }
    });

    test('should handle retry failure after successful token refresh', async () => {
      const mockTokens = { csrfToken: 'csrf-token' };
      const mockFreshTokens = { csrfToken: 'fresh-csrf-token' };

      vi.mocked(mockSecurityService.getTokens)
        .mockResolvedValueOnce(Result.success(mockTokens))
        .mockResolvedValueOnce(Result.success(mockFreshTokens));

      vi.mocked(mockEmailService.send)
        .mockResolvedValueOnce(Result.failure('403 Forbidden'))
        .mockResolvedValueOnce(Result.failure('Server error'));

      vi.mocked(mockSecurityService.refreshCsrfToken).mockResolvedValue(Result.success('fresh-csrf-token'));

      const result = await contactService.submit(mockFormData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Server error');
      }
      expect(mockSecurityService.resetTokens).not.toHaveBeenCalled();
    });
  });

  describe('isCsrfError', () => {
    test.each([
      ['403 Forbidden', true],
      ['Request failed with status 403', true],
      ['CSRF token invalid', true],
      ['Token expired', true],
      ['Forbidden access', true],
      ['Rate limit exceeded', false],
      ['Network error', false],
      ['Internal server error', false]
    ])('should identify CSRF error correctly: "%s" -> %s', (error, expected) => {
      // Access private method for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const isCsrfError = (contactService as any).isCsrfError.bind(contactService);
      expect(isCsrfError(error)).toBe(expected);
    });
  });
});

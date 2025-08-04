import { expect, test, describe, vi, beforeEach } from 'vitest';
import { SecurityService } from './SecurityService';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock loadTurnstileScript
vi.mock('../utils/turnstile-loader', () => ({
  loadTurnstileScript: vi.fn().mockResolvedValue(undefined)
}));

// Mock logger
vi.mock('@/shared/Logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn()
  }
}));

// Mock window.turnstile
const mockTurnstile = {
  render: vi.fn().mockReturnValue('widget-id-123'),
  reset: vi.fn(),
  remove: vi.fn()
};

Object.defineProperty(window, 'turnstile', {
  value: mockTurnstile,
  writable: true,
  configurable: true
});

describe('SecurityService', () => {
  let securityService: SecurityService;

  beforeEach(() => {
    vi.clearAllMocks();
    securityService = new SecurityService('http://localhost:3000');
  });

  describe('getTokens', () => {
    test('should fetch CSRF token on first call', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ csrfToken: 'new-csrf-token' })
      });

      const result = await securityService.getTokens();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          csrfToken: 'new-csrf-token',
          turnstileToken: undefined
        });
      }
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/csrf-token');
    });

    test('should use cached CSRF token on subsequent calls', async () => {
      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ csrfToken: 'cached-token' })
      });

      await securityService.getTokens();

      // Second call
      mockFetch.mockClear();
      const result = await securityService.getTokens();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.csrfToken).toBe('cached-token');
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should return failure when CSRF token fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await securityService.getTokens();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Failed to get CSRF token');
      }
    });
  });

  describe('refreshCsrfToken', () => {
    test('should fetch new CSRF token and update cache', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({ csrfToken: 'refreshed-token' })
      });

      const result = await securityService.refreshCsrfToken();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('refreshed-token');
      }

      // Verify cache is updated
      mockFetch.mockClear();
      const tokensResult = await securityService.getTokens();
      if (tokensResult.success) {
        expect(tokensResult.data.csrfToken).toBe('refreshed-token');
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });

    test('should handle refresh failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await securityService.refreshCsrfToken();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Network error');
      }
    });
  });

  describe('initializeTurnstile', () => {
    test('should initialize Turnstile widget successfully', async () => {
      const container = document.createElement('div');
      const siteKey = 'test-site-key';

      const result = await securityService.initializeTurnstile(container, siteKey);

      expect(result.success).toBe(true);
      expect(mockTurnstile.render).toHaveBeenCalledWith(container, {
        sitekey: siteKey,
        theme: 'auto',
        size: 'normal',
        retry: 'never',
        'refresh-timeout': 'manual',
        execution: 'render',
        callback: expect.any(Function),
        'error-callback': expect.any(Function),
        'expired-callback': expect.any(Function),
        'timeout-callback': expect.any(Function)
      });
    });

    test('should handle callback and set turnstile token', async () => {
      const container = document.createElement('div');
      let callbackFunction: (token: string) => void;

      mockTurnstile.render.mockImplementation((_, options) => {
        callbackFunction = options.callback;
        return 'widget-id-123';
      });

      await securityService.initializeTurnstile(container, 'test-key');

      // Simulate callback
      callbackFunction!('test-turnstile-token');

      // Verify token is stored
      const tokensResult = await securityService.getTokens();
      if (tokensResult.success) {
        expect(tokensResult.data.turnstileToken).toBe('test-turnstile-token');
      }
    });

    test('should handle error callback and clear token', async () => {
      const container = document.createElement('div');
      let errorCallback: () => void;

      mockTurnstile.render.mockImplementation((_, options) => {
        errorCallback = options['error-callback'];
        return 'widget-id-123';
      });

      await securityService.initializeTurnstile(container, 'test-key');

      // Simulate error
      errorCallback!();

      // Verify token is cleared
      const tokensResult = await securityService.getTokens();
      if (tokensResult.success) {
        expect(tokensResult.data.turnstileToken).toBeUndefined();
      }
    });

    test('should fail when Turnstile script does not load', async () => {
      // Temporarily remove window.turnstile
      const originalTurnstile = window.turnstile;
      Object.defineProperty(window, 'turnstile', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const container = document.createElement('div');
      const result = await securityService.initializeTurnstile(container, 'test-key');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Turnstile failed to load');
      }

      // Restore window.turnstile
      Object.defineProperty(window, 'turnstile', {
        value: originalTurnstile,
        writable: true,
        configurable: true
      });
    });
  });

  describe('resetTokens', () => {
    test('should reset turnstile token and widget', async () => {
      const container = document.createElement('div');

      // Initialize Turnstile first
      await securityService.initializeTurnstile(container, 'test-key');

      // Reset tokens
      await securityService.resetTokens();

      expect(mockTurnstile.reset).toHaveBeenCalledWith('widget-id-123');

      // Verify token is cleared
      const tokensResult = await securityService.getTokens();
      if (tokensResult.success) {
        expect(tokensResult.data.turnstileToken).toBeUndefined();
      }
    });
  });

  describe('cleanup', () => {
    test('should remove Turnstile widget and clear all tokens', async () => {
      // Initialize some state
      await securityService.initializeTurnstile(document.createElement('div'), 'test-key');

      securityService.cleanup();

      expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-id-123');
    });

    test('should handle cleanup when no widget exists', () => {
      expect(() => securityService.cleanup()).not.toThrow();
    });
  });

  test('should use default baseUrl when not provided', () => {
    const defaultService = new SecurityService();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue({ csrfToken: 'token' })
    });

    defaultService.getTokens();

    expect(mockFetch).toHaveBeenCalledWith('/api/csrf-token');
  });
});

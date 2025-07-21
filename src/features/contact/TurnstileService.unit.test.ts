import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TurnstileService } from './TurnstileService';

// Mock fetch globally
global.fetch = vi.fn();

describe('TurnstileService', () => {
  const mockSecretKey = 'test-secret-key';
  const mockToken = 'test-token';
  const mockIp = '192.168.1.1';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('TURNSTILE_SECRET_KEY', mockSecretKey);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('fromEnv', () => {
    it('should create instance when secret key is configured', () => {
      const result = TurnstileService.fromEnv();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeInstanceOf(TurnstileService);
      }
    });

    it('should fail when secret key is not configured', () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', '');

      const result = TurnstileService.fromEnv();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Turnstile configuration error');
      }
    });
  });

  describe('verifyToken', () => {
    let service: TurnstileService;

    beforeEach(() => {
      service = new TurnstileService(mockSecretKey);
    });

    it('should verify valid token successfully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, challenge_ts: '2024-01-01T00:00:00Z', hostname: 'example.com' })
      });

      const result = await service.verifyToken(mockToken, mockIp);

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(URLSearchParams),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );
    });

    it('should fail when token is empty', async () => {
      const result = await service.verifyToken('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification required');
      }
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle verification failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-response']
        })
      });

      const result = await service.verifyToken(mockToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Invalid security verification. Please complete the challenge again.');
      }
    });

    it('should handle timeout-or-duplicate error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['timeout-or-duplicate']
        })
      });

      const result = await service.verifyToken(mockToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification expired. Please refresh and try again.');
      }
    });

    it('should handle invalid secret key error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: false,
          'error-codes': ['invalid-input-secret']
        })
      });

      const result = await service.verifyToken(mockToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification configuration error');
        expect(result.error.internalMessage).toBe('Invalid Turnstile secret key');
      }
    });

    it('should handle API errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const result = await service.verifyToken(mockToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification service unavailable');
      }
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const result = await service.verifyToken(mockToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification error');
      }
    });

    it('should handle timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(abortError);

      const result = await service.verifyToken(mockToken);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBe('Security verification timeout');
      }
    });

    it('should include remote IP when provided', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await service.verifyToken(mockToken, mockIp);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const body = fetchCall[1].body as URLSearchParams;

      expect(body.get('remoteip')).toBe(mockIp);
    });
  });

  describe('isEnabled', () => {
    it('should return true when secret key is configured', () => {
      expect(TurnstileService.isEnabled()).toBe(true);
    });

    it('should return false when secret key is not configured', () => {
      vi.stubEnv('TURNSTILE_SECRET_KEY', '');

      expect(TurnstileService.isEnabled()).toBe(false);
    });
  });
});

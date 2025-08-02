import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnstileTokenTracker } from './TurnstileTokenTracker';

// Mock Redis
const mockRedis = {
  set: vi.fn(),
  ttl: vi.fn(),
  del: vi.fn(),
  keys: vi.fn()
};

// Mock Redis.fromEnv
vi.mock('@upstash/redis', () => ({
  Redis: {
    fromEnv: vi.fn(() => mockRedis)
  }
}));

// Mock logger
vi.mock('@/shared/Logger', () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn()
  }
}));

describe('TurnstileTokenTracker', () => {
  let tokenTracker: TurnstileTokenTracker;
  const testToken = 'test-token-123';

  beforeEach(() => {
    vi.clearAllMocks();
    tokenTracker = TurnstileTokenTracker.fromEnv();
  });

  describe('checkAndMarkTokenUsed', () => {
    it('should mark new token as used successfully', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const result = await tokenTracker.checkAndMarkTokenUsed(testToken);

      expect(result.isUsed).toBe(false);
      expect(result.markedAsUsed).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(expect.stringContaining('turnstile:used:'), '1', {
        nx: true,
        ex: 300
      });
    });

    it('should detect token replay attack', async () => {
      mockRedis.set.mockResolvedValue(null); // null means key already exists

      const result = await tokenTracker.checkAndMarkTokenUsed(testToken);

      expect(result.isUsed).toBe(true);
      expect(result.markedAsUsed).toBe(false);
    });

    it('should handle Redis errors gracefully (fail open)', async () => {
      mockRedis.set.mockRejectedValue(new Error('Redis connection failed'));

      const result = await tokenTracker.checkAndMarkTokenUsed(testToken);

      expect(result.isUsed).toBe(false);
      expect(result.markedAsUsed).toBe(false);
    });

    it('should use consistent token hashing', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await tokenTracker.checkAndMarkTokenUsed(testToken);
      const firstCallKey = mockRedis.set.mock.calls[0][0];

      await tokenTracker.checkAndMarkTokenUsed(testToken);
      const secondCallKey = mockRedis.set.mock.calls[1][0];

      expect(firstCallKey).toBe(secondCallKey);
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should clean up expired tokens', async () => {
      const expiredKeys = ['turnstile:used:hash1', 'turnstile:used:hash2'];
      const activeKeys = ['turnstile:used:hash3'];

      mockRedis.keys.mockResolvedValue([...expiredKeys, ...activeKeys]);
      mockRedis.ttl
        .mockResolvedValueOnce(-1) // expired
        .mockResolvedValueOnce(0) // expired
        .mockResolvedValueOnce(120); // active
      mockRedis.del.mockResolvedValue(1);

      const result = await tokenTracker.cleanupExpiredTokens();

      expect(result).toBe(2);
      expect(mockRedis.del).toHaveBeenCalledTimes(2);
      expect(mockRedis.del).toHaveBeenCalledWith('turnstile:used:hash1');
      expect(mockRedis.del).toHaveBeenCalledWith('turnstile:used:hash2');
    });

    it('should handle no keys gracefully', async () => {
      mockRedis.keys.mockResolvedValue([]);

      const result = await tokenTracker.cleanupExpiredTokens();

      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle Redis errors during cleanup', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      const result = await tokenTracker.cleanupExpiredTokens();

      expect(result).toBe(0);
    });
  });

  describe('token hashing', () => {
    it('should generate different hashes for different tokens', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await tokenTracker.checkAndMarkTokenUsed('token1');
      const key1 = mockRedis.set.mock.calls[0][0];

      await tokenTracker.checkAndMarkTokenUsed('token2');
      const key2 = mockRedis.set.mock.calls[1][0];

      expect(key1).not.toBe(key2);
    });

    it('should not store the actual token', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const sensitiveToken = 'sensitive-token-data-123';
      await tokenTracker.checkAndMarkTokenUsed(sensitiveToken);

      const storedKey = mockRedis.set.mock.calls[0][0];
      expect(storedKey).not.toContain(sensitiveToken);
      expect(storedKey).toContain('turnstile:used:');
    });
  });
});

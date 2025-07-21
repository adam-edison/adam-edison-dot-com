import { Redis } from '@upstash/redis';
import { createHash } from 'crypto';
import { logger } from '@/shared/Logger';

export interface TokenTrackingResult {
  isUsed: boolean;
  markedAsUsed: boolean;
}

/**
 * Tracks Turnstile tokens to prevent replay attacks
 * Stores used tokens in Redis with expiration matching token validity
 */
export class TurnstileTokenTracker {
  private static readonly TOKEN_PREFIX = 'turnstile:used:';
  private static readonly DEFAULT_EXPIRY_SECONDS = 300; // 5 minutes - typical Turnstile token lifetime

  constructor(private redis: Redis) {}

  static fromEnv(): TurnstileTokenTracker {
    const redis = Redis.fromEnv();
    return new TurnstileTokenTracker(redis);
  }

  /**
   * Check if a token has been used and mark it as used atomically
   * @param token The Turnstile token to check and mark
   * @returns Result indicating if token was already used and if it was successfully marked
   */
  async checkAndMarkTokenUsed(token: string): Promise<TokenTrackingResult> {
    const key = this.getTokenKey(token);

    try {
      // Use Redis SET with NX (only if not exists) and EX (expiration) flags
      // This is atomic - either the key is set (token not used) or it fails (token already used)
      const result = await this.redis.set(key, '1', {
        nx: true, // Only set if key doesn't exist
        ex: TurnstileTokenTracker.DEFAULT_EXPIRY_SECONDS // Expire after 5 minutes
      });

      const isUsed = result === null; // null means key already existed
      const markedAsUsed = result === 'OK'; // OK means key was set successfully

      if (isUsed) {
        logger.warn('Turnstile token replay attack detected', {
          tokenHash: this.hashToken(token),
          key
        });
      } else {
        logger.debug('Turnstile token marked as used', {
          tokenHash: this.hashToken(token),
          key,
          expirySeconds: TurnstileTokenTracker.DEFAULT_EXPIRY_SECONDS
        });
      }

      return {
        isUsed,
        markedAsUsed
      };
    } catch (error) {
      logger.error('Failed to check/mark Turnstile token usage', {
        error: error instanceof Error ? error.message : String(error),
        tokenHash: this.hashToken(token),
        key
      });

      // In case of Redis failure, allow the token (fail open)
      // This prevents Redis issues from blocking legitimate users
      return {
        isUsed: false,
        markedAsUsed: false
      };
    }
  }

  /**
   * Generate Redis key for token tracking
   */
  private getTokenKey(token: string): string {
    return `${TurnstileTokenTracker.TOKEN_PREFIX}${this.hashToken(token)}`;
  }

  /**
   * Create a hash of the token for storage (security best practice)
   * Don't store the actual token in Redis
   */
  private hashToken(token: string): string {
    // Use SHA-256 for secure, consistent hashing
    return createHash('sha256').update(token).digest('hex').substring(0, 16);
  }

  /**
   * Clean up expired token keys (for maintenance)
   * This is optional as Redis will auto-expire keys
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const pattern = `${TurnstileTokenTracker.TOKEN_PREFIX}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      // Check TTL for each key and delete expired ones
      let deletedCount = 0;
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        if (ttl <= 0) {
          await this.redis.del(key);
          deletedCount++;
        }
      }

      logger.debug('Cleaned up expired Turnstile tokens', {
        totalKeys: keys.length,
        deletedCount
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired Turnstile tokens', {
        error: error instanceof Error ? error.message : String(error)
      });
      return 0;
    }
  }
}

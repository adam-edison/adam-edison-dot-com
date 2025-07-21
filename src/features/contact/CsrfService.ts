import { Redis } from '@upstash/redis';
import { randomBytes } from 'crypto';

/**
 * Service for handling CSRF token generation and validation.
 */
export class CsrfService {
  private readonly redis: Redis;
  private readonly tokenPrefix = 'csrf:';
  private readonly tokenTtlSeconds = 900; // 15 minutes

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }

    this.redis = new Redis({ url, token });
  }

  /**
   * Generates a cryptographically secure CSRF token.
   * @returns The generated token.
   */
  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Creates a new CSRF token and stores it in Redis with a TTL.
   * @returns The newly created CSRF token.
   */
  public async createToken(): Promise<string> {
    const token = this.generateToken();
    const key = `${this.tokenPrefix}${token}`;

    // The value '1' is arbitrary; we only care about the key's existence.
    await this.redis.set(key, '1', { ex: this.tokenTtlSeconds });

    return token;
  }

  /**
   * Validates a CSRF token.
   * A token is valid if it exists in Redis. If it is valid, it is consumed
   * (deleted) to prevent reuse.
   * @param token The token to validate.
   * @returns A promise that resolves to true if the token is valid, false otherwise.
   */
  public async validateToken(token: string): Promise<boolean> {
    const key = `${this.tokenPrefix}${token}`;

    // Use DEL to check for existence and delete in a single atomic operation.
    // DEL returns the number of keys that were removed. If it's 1, the key existed.
    const deletedCount = await this.redis.del(key);

    return deletedCount > 0;
  }
}

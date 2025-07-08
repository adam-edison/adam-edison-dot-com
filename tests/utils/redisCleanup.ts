import { Redis } from '@upstash/redis';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local for Redis access
config({ path: join(process.cwd(), '.env.local') });

/**
 * Utility function to clean up Redis keys with a specific pattern
 * Used by E2E tests to clean up test keys after each test
 */
export async function cleanupRedisKeys(pattern: string): Promise<void> {
  try {
    const redis = Redis.fromEnv();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Redis cleanup error:', error);
  }
}

/**
 * Clean up all E2E test keys
 * This removes all keys matching the personal-website-e2e prefix
 */
export async function cleanupE2EKeys(): Promise<void> {
  await cleanupRedisKeys('personal-website-e2e:*');
}

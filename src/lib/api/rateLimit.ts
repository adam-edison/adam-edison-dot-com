import { Redis } from '@upstash/redis';
import { RateLimiter } from './RateLimiter';

// Create rate limiter instance with production configuration
const redis = Redis.fromEnv();
const rateLimiter = new RateLimiter({
  redis,
  limit: 5,
  window: '10 m',
  prefix: '@upstash/ratelimit'
});

// Rate limiting function that returns both success status and headers
export async function checkRateLimit(identifier: string) {
  return rateLimiter.checkLimit(identifier);
}

// Export the rate limiter instance for testing
export { rateLimiter };

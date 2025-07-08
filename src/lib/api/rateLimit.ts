import { Redis } from '@upstash/redis';
import { RateLimiter } from './RateLimiter';

// Create rate limiter instance with environment configuration
const redis = Redis.fromEnv();
const rateLimiter = new RateLimiter({
  redis,
  limit: parseInt(process.env.RATE_LIMIT_REQUESTS!),
  window: process.env.RATE_LIMIT_WINDOW!,
  prefix: 'personal-website'
});

// Rate limiting function that returns both success status and headers
export async function checkRateLimit(identifier: string) {
  return rateLimiter.checkLimit(identifier);
}

// Export the rate limiter instance for testing
export { rateLimiter };

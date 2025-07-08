import { Redis } from '@upstash/redis';
import { RateLimiter } from './RateLimiter';

// Create rate limiter instance with environment configuration
const redis = Redis.fromEnv();
const rateLimiter = new RateLimiter({
  redis,
  limit: parseInt(process.env.RATE_LIMIT_REQUESTS!),
  window: process.env.RATE_LIMIT_WINDOW!,
  prefix: process.env.REDIS_PREFIX!
});

// Create global rate limiter instance for site-wide limits
const globalRateLimiter = new RateLimiter({
  redis,
  limit: parseInt(process.env.GLOBAL_RATE_LIMIT_REQUESTS!),
  window: process.env.GLOBAL_RATE_LIMIT_WINDOW!,
  prefix: process.env.REDIS_PREFIX!
});

// Rate limiting function that returns both success status and headers
export async function checkRateLimit(identifier: string) {
  return rateLimiter.checkLimit(identifier);
}

// Global rate limiting function for site-wide limits
export async function checkGlobalRateLimit() {
  return globalRateLimiter.checkLimit('global');
}

// Export the rate limiter instances for testing
export { rateLimiter, globalRateLimiter };

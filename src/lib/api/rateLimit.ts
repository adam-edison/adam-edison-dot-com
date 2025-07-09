import { Redis } from '@upstash/redis';
import { RateLimiter, RateLimiterConfig } from './RateLimiter';

// Factory function for creating RateLimiter instances
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  return new RateLimiter(config);
}

// Factory function for creating RateLimiter with environment config
export function createRateLimiterFromEnv(options: {
  limitEnvVar: string;
  windowEnvVar: string;
  redis?: Redis;
}): RateLimiter {
  const redis = options.redis || Redis.fromEnv();
  return createRateLimiter({
    redis,
    limit: parseInt(process.env[options.limitEnvVar]!),
    window: process.env[options.windowEnvVar]!,
    prefix: process.env.REDIS_PREFIX!
  });
}

// Create rate limiter instances using factory functions
const redis = Redis.fromEnv();
const rateLimiter = createRateLimiter({
  redis,
  limit: parseInt(process.env.RATE_LIMIT_REQUESTS!),
  window: process.env.RATE_LIMIT_WINDOW!,
  prefix: process.env.REDIS_PREFIX!
});

const globalRateLimiter = createRateLimiter({
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

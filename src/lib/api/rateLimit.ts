// Rate limiting map
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Simple rate limiting function
export function rateLimit(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (now - userLimit.lastReset > windowMs) {
    userLimit.count = 1;
    userLimit.lastReset = now;
    return false;
  }

  if (userLimit.count >= maxRequests) {
    return true;
  }

  userLimit.count++;
  return false;
}

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local for integration tests
config({ path: join(process.cwd(), '.env.local') });

// Set default values for rate limiting environment variables if not provided
if (!process.env.RATE_LIMIT_REQUESTS) {
  process.env.RATE_LIMIT_REQUESTS = '5';
}

if (!process.env.RATE_LIMIT_WINDOW) {
  process.env.RATE_LIMIT_WINDOW = '10 m';
}

if (!process.env.GLOBAL_RATE_LIMIT_REQUESTS) {
  process.env.GLOBAL_RATE_LIMIT_REQUESTS = '100';
}

if (!process.env.GLOBAL_RATE_LIMIT_WINDOW) {
  process.env.GLOBAL_RATE_LIMIT_WINDOW = '1 h';
}

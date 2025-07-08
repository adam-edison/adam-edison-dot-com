import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local for integration tests
config({ path: join(process.cwd(), '.env.local') });

// Set test environment values for rate limiting
process.env.RATE_LIMIT_REQUESTS = '5';
process.env.RATE_LIMIT_WINDOW = '10 m';
process.env.GLOBAL_RATE_LIMIT_REQUESTS = '100';
process.env.GLOBAL_RATE_LIMIT_WINDOW = '1 h';
process.env.REDIS_PREFIX = 'personal-website-test';

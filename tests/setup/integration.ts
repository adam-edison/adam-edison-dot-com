import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local for integration tests
config({ path: join(process.cwd(), '.env.local') });

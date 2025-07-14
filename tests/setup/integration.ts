import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(process.cwd(), '.env.local'), quiet: true });

process.env.RATE_LIMIT_REQUESTS = '5';
process.env.RATE_LIMIT_WINDOW = '10 m';
process.env.GLOBAL_RATE_LIMIT_REQUESTS = '100';
process.env.GLOBAL_RATE_LIMIT_WINDOW = '1 h';

const basePrefix = process.env.REDIS_PREFIX!;
process.env.REDIS_PREFIX = `${basePrefix}-test`;

import { config } from 'dotenv';
import { join } from 'path';

export function setup() {
  config({ path: join(process.cwd(), '.env.local'), quiet: true });
}

/**
 * Build-time environment variable check.
 *
 * Loads the local env file via dotenv, then runs the same Zod schema the
 * runtime Configuration uses. If any required var is missing or malformed,
 * prints the full aggregated error and exits non-zero so the build fails fast.
 */

/* eslint-disable no-console */

import { config } from 'dotenv';
import { join } from 'path';
import { EnvironmentSchema } from '../src/shared/config/EnvironmentSchema';

config({ path: join(process.cwd(), '.env.local'), quiet: true });

const result = EnvironmentSchema.safeParse(process.env);

if (!result.success) {
  console.error('❌ Build failed: environment validation errors');
  for (const issue of result.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\nUpdate the corresponding env vars and re-run the build.');
  process.exit(1);
}

console.log('✅ All environment variables validated against EnvironmentSchema');
process.exit(0);

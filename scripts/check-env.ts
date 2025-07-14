/**
 * Build-time environment variable checker
 *
 * This script validates that all variables defined in .env.example
 * are present in the current environment. It loads from .env.local
 * first, then checks against .env.example requirements.
 *
 * It's designed to fail fast during build processes (like Netlify
 * deployment) if any required environment variables are missing.
 */

/* eslint-disable no-console */

import { config, parse } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function checkEnvironmentVariables(): void {
  config({ path: join(process.cwd(), '.env.local'), quiet: true });

  const envExamplePath = join(process.cwd(), '.env.example');

  if (!existsSync(envExamplePath)) {
    console.error('Error: .env.example file not found');
    process.exit(1);
  }

  const envExampleContent = readFileSync(envExamplePath, 'utf8');
  const envExampleVars = parse(envExampleContent);
  const requiredVars = Object.keys(envExampleVars);
  const missingVars: string[] = [];

  console.log('🔍 Checking environment variables...');
  console.log(`📋 Found ${requiredVars.length} variables in .env.example`);

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error('❌ Build failed: Missing required environment variables:');
    missingVars.forEach((varName: string) => {
      console.error(`   - ${varName}`);
    });
    console.error('\nPlease ensure all variables from .env.example are configured.');
    process.exit(1);
  }

  console.log('✅ All environment variables are configured');
  console.log('🚀 Proceeding with build...');
}

checkEnvironmentVariables();

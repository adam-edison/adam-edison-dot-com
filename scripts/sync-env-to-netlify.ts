#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * Sync environment variables from .env.prod to Netlify
 *
 * Prerequisites:
 * - Install Netlify CLI: https://docs.netlify.com/cli/get-started/
 * - Login to Netlify: netlify login
 * - Link site: netlify link
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as readline from 'readline';

interface EnvVariable {
  key: string;
  value: string;
  masked: string;
}

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function maskValue(value: string): string {
  if (!value) return '(empty)';

  // For very short values, mask completely
  if (value.length <= 4) {
    return '*'.repeat(value.length);
  }

  // For longer values, show first 2 and last 2 characters
  const firstChars = value.substring(0, 2);
  const lastChars = value.substring(value.length - 2);
  const maskedMiddle = '*'.repeat(Math.max(value.length - 4, 4));

  return `${firstChars}${maskedMiddle}${lastChars}`;
}

function checkNetlifyCLI(): boolean {
  try {
    execSync('netlify --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkNetlifyAuth(): boolean {
  try {
    const result = execSync('netlify status', { encoding: 'utf8', stdio: 'pipe' });
    // Check for various possible indicators of being logged in
    // The output may contain ANSI color codes, so check for partial matches
    return (
      result.includes('Current Netlify User') ||
      result.includes('Name:') ||
      result.includes('Email:') ||
      result.includes('Teams:')
    );
  } catch {
    return false;
  }
}

function checkNetlifyLink(): boolean {
  try {
    const result = execSync('netlify status', { encoding: 'utf8', stdio: 'pipe' });
    // Check for indicators that a site is linked
    return (
      result.includes('Current project:') ||
      result.includes('Project Id:') ||
      result.includes('Admin URL:') ||
      result.includes('Site ID:')
    );
  } catch {
    return false;
  }
}

async function promptUser(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

async function main() {
  console.log(`\n${colors.bright}${colors.blue}Netlify Environment Variable Sync${colors.reset}\n`);

  // Check prerequisites
  console.log(`${colors.yellow}Checking prerequisites...${colors.reset}`);

  if (!checkNetlifyCLI()) {
    console.error(`${colors.red}✗ Netlify CLI not found${colors.reset}`);
    console.log(`\nPlease install Netlify CLI first:`);
    console.log(`${colors.cyan}https://docs.netlify.com/cli/get-started/${colors.reset}\n`);
    process.exit(1);
  }
  console.log(`${colors.green}✓ Netlify CLI installed${colors.reset}`);

  if (!checkNetlifyAuth()) {
    console.error(`${colors.red}✗ Not logged into Netlify${colors.reset}`);
    console.log(`\nPlease login first:`);
    console.log(`${colors.cyan}netlify login${colors.reset}\n`);
    process.exit(1);
  }
  console.log(`${colors.green}✓ Logged into Netlify${colors.reset}`);

  if (!checkNetlifyLink()) {
    console.error(`${colors.red}✗ Site not linked${colors.reset}`);
    console.log(`\nPlease link your site first:`);
    console.log(`${colors.cyan}netlify link${colors.reset}\n`);
    process.exit(1);
  }
  console.log(`${colors.green}✓ Site linked${colors.reset}`);

  // Load .env.prod
  const envPath = path.join(process.cwd(), '.env.prod');

  if (!fs.existsSync(envPath)) {
    console.error(`\n${colors.red}✗ .env.prod file not found${colors.reset}`);
    console.log(`Please create a .env.prod file in the project root.`);
    process.exit(1);
  }

  const envConfig = dotenv.config({ path: envPath, quiet: true });

  if (envConfig.error) {
    console.error(`\n${colors.red}✗ Error parsing .env.prod:${colors.reset}`, envConfig.error);
    process.exit(1);
  }

  const envVars: EnvVariable[] = [];

  for (const [key, value] of Object.entries(envConfig.parsed || {})) {
    envVars.push({
      key,
      value,
      masked: maskValue(value)
    });
  }

  if (envVars.length === 0) {
    console.log(`\n${colors.yellow}No environment variables found in .env.prod${colors.reset}`);
    process.exit(0);
  }

  // Get current Netlify env vars for comparison
  console.log(`\n${colors.yellow}Fetching current Netlify environment variables...${colors.reset}`);

  const currentEnvVars: Record<string, string> = {};
  try {
    // Use JSON format which returns actual values
    const envListOutput = execSync('netlify env:list --json', { encoding: 'utf8', stdio: 'pipe' });
    const envList = JSON.parse(envListOutput);

    // The JSON format returns an object with key-value pairs
    if (typeof envList === 'object' && envList !== null) {
      Object.entries(envList).forEach(([key, value]) => {
        currentEnvVars[key] = typeof value === 'string' ? value : '';
      });
      console.log(
        `${colors.green}Successfully fetched ${Object.keys(currentEnvVars).length} environment variables${colors.reset}`
      );
    } else {
      console.log(`${colors.yellow}Unexpected JSON format from netlify env:list${colors.reset}`);
    }
  } catch (error) {
    console.log(`${colors.yellow}Could not fetch current environment variables${colors.reset}`);
    if (error instanceof Error) {
      console.log(`${colors.dim}Error: ${error.message}${colors.reset}`);
    }
    console.log(`${colors.dim}Proceeding without comparison to current values...${colors.reset}`);
  }

  // Display dry run results
  console.log(`\n${colors.bright}${colors.blue}DRY RUN - Environment Variable Changes:${colors.reset}\n`);

  const maxKeyLength = Math.max(...envVars.map((v) => v.key.length));

  let newVars = 0;
  let updatedVars = 0;
  let unchangedVars = 0;

  envVars.forEach(({ key, masked }) => {
    const paddedKey = key.padEnd(maxKeyLength);

    if (!(key in currentEnvVars)) {
      console.log(
        `  ${colors.green}+ NEW${colors.reset}      ${colors.cyan}${paddedKey}${colors.reset} = ${colors.dim}${masked}${colors.reset}`
      );
      newVars++;
    } else if (currentEnvVars[key] !== envVars.find((v) => v.key === key)?.value) {
      console.log(
        `  ${colors.yellow}~ UPDATE${colors.reset}   ${colors.cyan}${paddedKey}${colors.reset} = ${colors.dim}${masked}${colors.reset}`
      );
      updatedVars++;
    } else {
      console.log(`  ${colors.dim}  NO CHANGE ${paddedKey} = ${masked}${colors.reset}`);
      unchangedVars++;
    }
  });

  // Check for variables that will be removed (exist in Netlify but not in .env.prod)
  const removedVars: string[] = [];
  Object.keys(currentEnvVars).forEach((key) => {
    if (!envVars.find((v) => v.key === key)) {
      removedVars.push(key);
    }
  });

  if (removedVars.length > 0) {
    console.log(`\n${colors.red}Variables that exist in Netlify but NOT in .env.prod:${colors.reset}`);
    removedVars.forEach((key) => {
      console.log(`  ${colors.red}- REMOVE${colors.reset}   ${colors.cyan}${key}${colors.reset}`);
    });
  }

  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`  ${colors.green}${newVars} new variables${colors.reset}`);
  console.log(`  ${colors.yellow}${updatedVars} variables to update${colors.reset}`);
  console.log(`  ${colors.dim}${unchangedVars} unchanged variables${colors.reset}`);
  if (removedVars.length > 0) {
    console.log(`  ${colors.red}${removedVars.length} variables to remove${colors.reset}`);
  }

  console.log(`\n${colors.yellow}⚠️  This is a DRY RUN preview.${colors.reset}`);
  console.log(
    `The values shown above will be synced from your local ${colors.cyan}.env.prod${colors.reset} file to Netlify.`
  );

  if (removedVars.length > 0) {
    console.log(`${colors.red}Variables marked for removal will be deleted from Netlify.${colors.reset}`);
  }

  console.log('');

  const confirmed = await promptUser(
    `${colors.bright}Do you want to proceed with these changes? (y/N): ${colors.reset}`
  );

  if (!confirmed) {
    console.log(`\n${colors.yellow}Operation cancelled.${colors.reset}`);
    process.exit(0);
  }

  // Sync variables
  console.log(`\n${colors.bright}Syncing environment variables...${colors.reset}\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const { key, value } of envVars) {
    // Skip unchanged variables
    if (key in currentEnvVars && currentEnvVars[key] === value) {
      skippedCount++;
      continue;
    }

    try {
      const action = !(key in currentEnvVars) ? 'Creating' : 'Updating';
      process.stdout.write(`  ${action} ${colors.cyan}${key}${colors.reset}... `);

      // Use netlify env:set command
      execSync(`netlify env:set ${key} "${value.replace(/"/g, '\\"')}"`, {
        stdio: 'ignore',
        encoding: 'utf8'
      });

      console.log(`${colors.green}✓${colors.reset}`);
      successCount++;
    } catch (error) {
      console.log(`${colors.red}✗${colors.reset}`);
      errorCount++;

      if (error instanceof Error) {
        console.error(`    ${colors.red}Error: ${error.message}${colors.reset}`);
      }
    }
  }

  // Remove variables that don't exist in .env.prod
  let removedCount = 0;
  let removeErrorCount = 0;

  if (removedVars.length > 0) {
    console.log(`\n${colors.bright}Removing obsolete variables...${colors.reset}\n`);

    for (const key of removedVars) {
      try {
        process.stdout.write(`  Removing ${colors.cyan}${key}${colors.reset}... `);

        // Use netlify env:unset command
        execSync(`netlify env:unset ${key}`, {
          stdio: 'ignore',
          encoding: 'utf8'
        });

        console.log(`${colors.green}✓${colors.reset}`);
        removedCount++;
      } catch (error) {
        console.log(`${colors.red}✗${colors.reset}`);
        removeErrorCount++;

        if (error instanceof Error) {
          console.error(`    ${colors.red}Error: ${error.message}${colors.reset}`);
        }
      }
    }
  }

  // Summary
  console.log(`\n${colors.bright}Summary:${colors.reset}`);
  console.log(`  ${colors.green}✓ ${successCount} variables synced successfully${colors.reset}`);

  if (skippedCount > 0) {
    console.log(`  ${colors.dim}○ ${skippedCount} variables skipped (already up-to-date)${colors.reset}`);
  }

  if (removedCount > 0) {
    console.log(`  ${colors.green}✓ ${removedCount} variables removed successfully${colors.reset}`);
  }

  if (errorCount > 0) {
    console.log(`  ${colors.red}✗ ${errorCount} variables failed to sync${colors.reset}`);
  }

  if (removeErrorCount > 0) {
    console.log(`  ${colors.red}✗ ${removeErrorCount} variables failed to remove${colors.reset}`);
  }

  console.log(`\n${colors.dim}Note: Changes may take a few minutes to propagate.${colors.reset}`);
  console.log(`${colors.dim}You may need to redeploy for changes to take effect.${colors.reset}\n`);

  process.exit(errorCount > 0 || removeErrorCount > 0 ? 1 : 0);
}

// Run the script
main().catch((error) => {
  console.error(`\n${colors.red}Unexpected error:${colors.reset}`, error);
  process.exit(1);
});

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

interface SyncResult {
  successCount: number;
  errorCount: number;
  skippedCount: number;
  removedCount: number;
  removeErrorCount: number;
}

interface EnvComparison {
  newVars: number;
  updatedVars: number;
  unchangedVars: number;
  removedVars: string[];
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

// Helper functions for colorized output
function colorize(text: string, color: string): string {
  return `${color}${text}${colors.reset}`;
}

function success(text: string): string {
  return colorize(text, colors.green);
}

function error(text: string): string {
  return colorize(text, colors.red);
}

function warning(text: string): string {
  return colorize(text, colors.yellow);
}

function info(text: string): string {
  return colorize(text, colors.cyan);
}

function dim(text: string): string {
  return colorize(text, colors.dim);
}

function bright(text: string): string {
  return colorize(text, colors.bright);
}

function title(text: string): string {
  return colorize(text, colors.bright + colors.blue);
}

function getColorizedString(action: string, key: string, value: string, actionColor: string): string {
  const paddedAction = action.padEnd(10);
  return `  ${colorize(paddedAction, actionColor)} ${info(key)} = ${dim(value)}`;
}

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

function validatePrerequisites(): void {
  console.log(warning('Checking prerequisites...'));

  if (!checkNetlifyCLI()) {
    console.error(error('✗ Netlify CLI not found'));
    console.log(`\nPlease install Netlify CLI first:`);
    console.log(info('https://docs.netlify.com/cli/get-started/') + '\n');
    process.exit(1);
  }
  console.log(success('✓ Netlify CLI installed'));

  if (!checkNetlifyAuth()) {
    console.error(error('✗ Not logged into Netlify'));
    console.log(`\nPlease login first:`);
    console.log(info('netlify login') + '\n');
    process.exit(1);
  }
  console.log(success('✓ Logged into Netlify'));

  if (!checkNetlifyLink()) {
    console.error(error('✗ Site not linked'));
    console.log(`\nPlease link your site first:`);
    console.log(info('netlify link') + '\n');
    process.exit(1);
  }
  console.log(success('✓ Site linked'));
}

function loadEnvironmentVariables(): EnvVariable[] {
  const envPath = path.join(process.cwd(), '.env.prod');

  if (!fs.existsSync(envPath)) {
    console.error('\n' + error('✗ .env.prod file not found'));
    console.log(`Please create a .env.prod file in the project root.`);
    process.exit(1);
  }

  const envConfig = dotenv.config({ path: envPath, quiet: true });

  if (envConfig.error) {
    console.error('\n' + error('✗ Error parsing .env.prod:'), envConfig.error);
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
    console.log('\n' + warning('No environment variables found in .env.prod'));
    process.exit(0);
  }

  return envVars;
}

function fetchNetlifyEnvironmentVariables(): Record<string, string> {
  console.log('\n' + warning('Fetching current Netlify environment variables...'));

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
      console.log(success(`Successfully fetched ${Object.keys(currentEnvVars).length} environment variables`));
    } else {
      console.log(warning('Unexpected JSON format from netlify env:list'));
    }
  } catch (error) {
    console.log(warning('Could not fetch current environment variables'));
    if (error instanceof Error) {
      console.log(dim(`Error: ${error.message}`));
    }
    console.log(dim('Proceeding without comparison to current values...'));
  }

  return currentEnvVars;
}

function compareEnvironmentVariables(envVars: EnvVariable[], currentEnvVars: Record<string, string>): EnvComparison {
  let newVars = 0;
  let updatedVars = 0;
  let unchangedVars = 0;

  envVars.forEach(({ key, value }) => {
    if (!(key in currentEnvVars)) {
      newVars++;
    } else if (currentEnvVars[key] !== value) {
      updatedVars++;
    } else {
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

  return { newVars, updatedVars, unchangedVars, removedVars };
}

function displayDryRunResults(
  envVars: EnvVariable[],
  currentEnvVars: Record<string, string>,
  comparison: EnvComparison
): void {
  console.log('\n' + title('DRY RUN - Environment Variable Changes:') + '\n');

  const maxKeyLength = Math.max(...envVars.map((v) => v.key.length));

  envVars.forEach(({ key, value, masked }) => {
    const paddedKey = key.padEnd(maxKeyLength);

    if (!(key in currentEnvVars)) {
      console.log(getColorizedString('+ NEW', paddedKey, masked, colors.green));
    } else if (currentEnvVars[key] !== value) {
      console.log(getColorizedString('~ UPDATE', paddedKey, masked, colors.yellow));
    } else {
      console.log(getColorizedString('NO CHANGE', paddedKey, masked, colors.dim));
    }
  });

  if (comparison.removedVars.length > 0) {
    console.log('\n' + error('Variables that exist in Netlify but NOT in .env.prod:'));
    comparison.removedVars.forEach((key) => {
      console.log(getColorizedString('- REMOVE', key, '', colors.red));
    });
  }

  console.log('\n' + bright('Summary:'));
  console.log(`  ${success(comparison.newVars + ' new variables')}`);
  console.log(`  ${warning(comparison.updatedVars + ' variables to update')}`);
  console.log(`  ${dim(comparison.unchangedVars + ' unchanged variables')}`);
  if (comparison.removedVars.length > 0) {
    console.log(`  ${error(comparison.removedVars.length + ' variables to remove')}`);
  }

  console.log('\n' + warning('⚠️  This is a DRY RUN preview.'));
  console.log(`The values shown above will be synced from your local ${info('.env.prod')} file to Netlify.`);

  if (comparison.removedVars.length > 0) {
    console.log(error('Variables marked for removal will be deleted from Netlify.'));
  }

  console.log('');
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

async function confirmOperation(): Promise<void> {
  const confirmed = await promptUser(bright('Do you want to proceed with these changes? (y/N): '));

  if (!confirmed) {
    console.log('\n' + warning('Operation cancelled.'));
    process.exit(0);
  }
}

function syncEnvironmentVariable(key: string, value: string): void {
  try {
    // Use netlify env:set command
    execSync(`netlify env:set ${key} "${value.replace(/"/g, '\\"')}"`, {
      stdio: 'ignore',
      encoding: 'utf8'
    });
    console.log(success('✓'));
  } catch (err) {
    console.log(error('✗'));
    if (err instanceof Error) {
      console.error(`    ${error('Error: ' + err.message)}`);
    }
    throw err;
  }
}

function removeEnvironmentVariable(key: string): void {
  try {
    // Use netlify env:unset command
    execSync(`netlify env:unset ${key}`, {
      stdio: 'ignore',
      encoding: 'utf8'
    });
    console.log(success('✓'));
  } catch (err) {
    console.log(error('✗'));
    if (err instanceof Error) {
      console.error(`    ${error('Error: ' + err.message)}`);
    }
    throw err;
  }
}

function syncEnvironmentVariables(envVars: EnvVariable[], currentEnvVars: Record<string, string>): SyncResult {
  console.log('\n' + bright('Syncing environment variables...') + '\n');

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
      process.stdout.write(`  ${action} ${info(key)}... `);

      syncEnvironmentVariable(key, value);
      successCount++;
    } catch {
      errorCount++;
    }
  }

  return { successCount, errorCount, skippedCount, removedCount: 0, removeErrorCount: 0 };
}

function removeObsoleteVariables(removedVars: string[]): { removedCount: number; removeErrorCount: number } {
  let removedCount = 0;
  let removeErrorCount = 0;

  if (removedVars.length === 0) {
    return { removedCount, removeErrorCount };
  }

  console.log('\n' + bright('Removing obsolete variables...') + '\n');

  for (const key of removedVars) {
    try {
      process.stdout.write(`  Removing ${info(key)}... `);
      removeEnvironmentVariable(key);
      removedCount++;
    } catch {
      removeErrorCount++;
    }
  }

  return { removedCount, removeErrorCount };
}

function displaySummary(result: SyncResult): void {
  console.log('\n' + bright('Summary:'));
  console.log(`  ${success('✓ ' + result.successCount + ' variables synced successfully')}`);

  if (result.skippedCount > 0) {
    console.log(`  ${dim('○ ' + result.skippedCount + ' variables skipped (already up-to-date)')}`);
  }

  if (result.removedCount > 0) {
    console.log(`  ${success('✓ ' + result.removedCount + ' variables removed successfully')}`);
  }

  if (result.errorCount > 0) {
    console.log(`  ${error('✗ ' + result.errorCount + ' variables failed to sync')}`);
  }

  if (result.removeErrorCount > 0) {
    console.log(`  ${error('✗ ' + result.removeErrorCount + ' variables failed to remove')}`);
  }

  console.log('\n' + dim('Note: Changes may take a few minutes to propagate.'));
  console.log(dim('You may need to redeploy for changes to take effect.') + '\n');
}

async function main() {
  console.log('\n' + title('Netlify Environment Variable Sync') + '\n');

  validatePrerequisites();
  const envVars = loadEnvironmentVariables();
  const currentEnvVars = fetchNetlifyEnvironmentVariables();
  const comparison = compareEnvironmentVariables(envVars, currentEnvVars);

  displayDryRunResults(envVars, currentEnvVars, comparison);
  await confirmOperation();

  const syncResult = syncEnvironmentVariables(envVars, currentEnvVars);
  const { removedCount, removeErrorCount } = removeObsoleteVariables(comparison.removedVars);

  const finalResult: SyncResult = {
    ...syncResult,
    removedCount,
    removeErrorCount
  };

  displaySummary(finalResult);

  process.exit(finalResult.errorCount > 0 || finalResult.removeErrorCount > 0 ? 1 : 0);
}

// Run the script
main().catch((err) => {
  console.error('\n' + error('Unexpected error:'), err);
  process.exit(1);
});

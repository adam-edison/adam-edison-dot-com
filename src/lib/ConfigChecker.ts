import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'dotenv';
import { logger } from '@/lib/logger/Logger';

export interface ConfigCheckResult {
  configured: boolean;
  missingVars?: string[];
}

export class ConfigChecker {
  // Essential variables required for contact form functionality at runtime
  private static readonly CONTACT_FORM_REQUIRED_VARS = [
    'RESEND_API_KEY',
    'FROM_EMAIL',
    'TO_EMAIL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ];

  public static checkConfiguration(
    requiredVars: string[],
    currentEnv: Record<string, string | undefined>
  ): ConfigCheckResult {
    const missing = requiredVars.filter((key) => !currentEnv[key]);

    if (missing.length > 0) {
      logger.error('Missing required environment variables:', missing);
      return {
        configured: false,
        missingVars: missing
      };
    }

    return {
      configured: true
    };
  }

  // Runtime check for essential contact form variables only
  public static checkContactFormRequirements(): ConfigCheckResult {
    return ConfigChecker.checkConfiguration(ConfigChecker.CONTACT_FORM_REQUIRED_VARS, process.env);
  }

  // Build-time check that reads from filesystem (checks ALL variables from .env.example)
  public static checkConfigurationFromFile(): ConfigCheckResult {
    try {
      const envExamplePath = join(process.cwd(), '.env.example');
      const envExampleContent = readFileSync(envExamplePath, 'utf8');
      const envExample = parse(envExampleContent);
      const requiredVars = Object.keys(envExample);

      return ConfigChecker.checkConfiguration(requiredVars, process.env);
    } catch (error) {
      logger.error('Failed to read .env.example file:', error);
      throw new Error('Cannot read .env.example file');
    }
  }
}

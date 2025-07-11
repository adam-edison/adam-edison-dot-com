import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'dotenv';
import { logger } from '@/lib/logger/Logger';

export interface ConfigCheckResult {
  configured: boolean;
  missingVars?: string[];
}

export class ConfigChecker {
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

  // Convenience method that reads from filesystem
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

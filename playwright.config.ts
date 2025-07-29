import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables from .env.local
config({ path: join(process.cwd(), '.env.local'), quiet: true });

// Set NODE_ENV to test for automated E2E tests
process.env.NODE_ENV = 'test';

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: '**/interactive/**',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    stdout: 'ignore',
    stderr: 'ignore',
    env: {
      NODE_ENV: 'test',
      RECAPTCHA_SCORE_THRESHOLD: '0',
      SEND_EMAIL_ENABLED: 'false',
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? 'test-key-e2e',
      FROM_EMAIL: process.env.FROM_EMAIL ?? 'test@example.com',
      TO_EMAIL: process.env.TO_EMAIL ?? 'recipient@example.com',
      EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME ?? 'E2E Test',
      EMAIL_RECIPIENT_NAME: process.env.EMAIL_RECIPIENT_NAME ?? 'E2E Recipient',
      CONTACT_IP_RATE_LIMIT_REQUESTS: '5',
      CONTACT_IP_RATE_LIMIT_WINDOW: '10 m',
      CONTACT_GLOBAL_RATE_LIMIT_REQUESTS: '100',
      CONTACT_GLOBAL_RATE_LIMIT_WINDOW: '1 h',
      CONTACT_EMAIL_RATE_LIMIT_REQUESTS: '3',
      CONTACT_EMAIL_RATE_LIMIT_WINDOW: '1 h',
      REDIS_PREFIX: `${process.env.REDIS_PREFIX ?? 'personal-website'}-e2e`,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? 'https://definite-griffon-56527.upstash.io',
      UPSTASH_REDIS_REST_TOKEN:
        process.env.UPSTASH_REDIS_REST_TOKEN ?? 'AdzPAAIjcDE4NmEyZWIwZjMxNDY0YTgwYTg2OWVjYzIzMDBmYzg0ZXAxMA',
      TURNSTILE_ENABLED: 'false'
    }
  }
});

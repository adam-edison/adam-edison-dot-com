import { defineConfig, devices } from '@playwright/test';
import { setup } from './tests/setup/e2e';

setup();

export default defineConfig({
  testDir: './tests/e2e',
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
      REDIS_PREFIX: `${process.env.REDIS_PREFIX}-e2e`,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
    }
  }
});

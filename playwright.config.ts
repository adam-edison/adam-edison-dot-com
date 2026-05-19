import { defineConfig, devices } from '@playwright/test';
import { setup } from './tests/setup/e2e';

setup();

// Cloudflare Turnstile testing keys
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TURNSTILE_ALWAYS_PASS_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_ALWAYS_PASS_SECRET = '1x0000000000000000000000000000000AA';
const TURNSTILE_ALWAYS_FAIL_SECRET = '2x0000000000000000000000000000000AA';

const sharedEnv = {
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_ALWAYS_PASS_SITE_KEY,
  SEND_EMAIL_ENABLED: 'false',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? 'test-key-e2e',
  FROM_EMAIL: process.env.FROM_EMAIL ?? 'test@example.com',
  TO_EMAIL: process.env.TO_EMAIL ?? 'recipient@example.com',
  EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME ?? 'E2E Test',
  EMAIL_RECIPIENT_NAME: process.env.EMAIL_RECIPIENT_NAME ?? 'E2E Recipient',
  RATE_LIMIT_REQUESTS: '5',
  RATE_LIMIT_WINDOW: '10 m',
  GLOBAL_RATE_LIMIT_REQUESTS: '100',
  GLOBAL_RATE_LIMIT_WINDOW: '1 h',
  REDIS_PREFIX: `${process.env.REDIS_PREFIX}-e2e`,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
};

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'on-first-retry'
  },
  projects: [
    {
      name: 'happy-path',
      testIgnore: /fail-closed/,
      use: { ...devices['Desktop Chrome'], headless: true, baseURL: 'http://localhost:3000' }
    },
    {
      name: 'fail-closed',
      testMatch: /fail-closed/,
      use: { ...devices['Desktop Chrome'], headless: true, baseURL: 'http://localhost:3001' }
    }
  ],
  webServer: [
    {
      command: 'PORT=3000 npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'ignore',
      env: { ...sharedEnv, TURNSTILE_SECRET_KEY: TURNSTILE_ALWAYS_PASS_SECRET }
    },
    {
      command: 'PORT=3001 npm run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: false,
      timeout: 120 * 1000,
      stdout: 'ignore',
      stderr: 'ignore',
      env: { ...sharedEnv, TURNSTILE_SECRET_KEY: TURNSTILE_ALWAYS_FAIL_SECRET }
    }
  ]
});

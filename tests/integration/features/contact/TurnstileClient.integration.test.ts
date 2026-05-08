// @vitest-environment node
import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import assert from 'node:assert';
import { TurnstileClient } from '@/features/contact/TurnstileClient';
import { Configuration } from '@/shared/config/Configuration';

/*
  Hits the real Cloudflare siteverify endpoint with documented testing keys to
  prove the wiring works end-to-end. Testing key reference:
  https://developers.cloudflare.com/turnstile/troubleshooting/testing/

    1x0000000000000000000000000000000AA  always passes verification
    2x0000000000000000000000000000000AA  always fails verification

  Run with: npm run test:integration tests/integration/features/contact/TurnstileClient.integration.test.ts
*/

const ALWAYS_PASS_SECRET = '1x0000000000000000000000000000000AA';
const ALWAYS_FAIL_SECRET = '2x0000000000000000000000000000000AA';

function buildClientWith(secret: string): TurnstileClient {
  process.env.TURNSTILE_SECRET_KEY = secret;
  Configuration.reset();
  return TurnstileClient.fromEnv();
}

describe('TurnstileClient (integration against real Cloudflare)', () => {
  let originalSecret: string | undefined;

  beforeEach(() => {
    originalSecret = process.env.TURNSTILE_SECRET_KEY;
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      delete process.env.TURNSTILE_SECRET_KEY;
    } else {
      process.env.TURNSTILE_SECRET_KEY = originalSecret;
    }
    Configuration.reset();
  });

  it('returns success when Cloudflare accepts the token (always-pass secret)', async () => {
    const client = buildClientWith(ALWAYS_PASS_SECRET);
    const result = await client.verifyToken('any-token-the-real-server-will-accept');
    expect(result.success).toBe(true);
  });

  it('fails closed when Cloudflare rejects the token (always-fail secret)', async () => {
    const client = buildClientWith(ALWAYS_FAIL_SECRET);
    const result = await client.verifyToken('any-token-the-real-server-will-reject');
    assert(!result.success);
    expect(result.error.errorCodes).toBeDefined();
    expect(result.error.internalMessage).toContain('verification rejected');
  });
});

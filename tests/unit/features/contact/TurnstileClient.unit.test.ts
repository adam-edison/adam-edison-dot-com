import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import assert from 'node:assert';
import { TurnstileClient, TURNSTILE_VERIFY_URL } from '@/features/contact/TurnstileClient';

const validEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  TURNSTILE_SECRET_KEY: 'test-secret'
} as unknown as NodeJS.ProcessEnv;

function buildClient(): TurnstileClient {
  const result = TurnstileClient.fromEnv(validEnv);
  assert(result.success, 'Expected TurnstileClient to construct successfully');
  return result.data;
}

function mockFetchOnce(response: Partial<Response>): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response));
}

function mockFetchReject(error: Error): void {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(error));
}

describe('TurnstileClient', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('fromEnv', () => {
    it('returns failure when TURNSTILE_SECRET_KEY is missing', () => {
      const result = TurnstileClient.fromEnv({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
      assert(!result.success);
      expect(result.error.httpStatusCode).toBe(503);
      expect(result.error.internalMessage).toContain('TURNSTILE_SECRET_KEY');
    });

    it('returns failure when TURNSTILE_SECRET_KEY is empty string', () => {
      const result = TurnstileClient.fromEnv({ NODE_ENV: 'test', TURNSTILE_SECRET_KEY: '' } as NodeJS.ProcessEnv);
      assert(!result.success);
      expect(result.error.httpStatusCode).toBe(503);
    });

    it('returns success when TURNSTILE_SECRET_KEY is set', () => {
      const result = TurnstileClient.fromEnv(validEnv);
      expect(result.success).toBe(true);
    });
  });

  describe('verifyToken', () => {
    it('fails closed when token is empty string', async () => {
      const client = buildClient();
      const result = await client.verifyToken('');
      assert(!result.success);
      expect(result.error.internalMessage).toContain('missing or empty');
    });

    it('fails closed when token is whitespace only', async () => {
      const client = buildClient();
      const result = await client.verifyToken('   ');
      assert(!result.success);
      expect(result.error.internalMessage).toContain('missing or empty');
    });

    it('fails closed when fetch rejects (network error)', async () => {
      mockFetchReject(new Error('Network down'));
      const client = buildClient();
      const result = await client.verifyToken('valid-token');
      assert(!result.success);
      expect(result.error.internalMessage).toContain('Network down');
    });

    it('fails closed when API returns non-OK status', async () => {
      mockFetchOnce({ ok: false, status: 500 } as Response);
      const client = buildClient();
      const result = await client.verifyToken('valid-token');
      assert(!result.success);
      expect(result.error.internalMessage).toContain('status 500');
    });

    it('fails closed when API responds with success=false', async () => {
      mockFetchOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] })
      } as Response);
      const client = buildClient();
      const result = await client.verifyToken('bad-token');
      assert(!result.success);
      expect(result.error.errorCodes).toEqual(['invalid-input-response']);
      expect(result.error.internalMessage).toContain('invalid-input-response');
    });

    it('fails closed when API responds with success=false and no error codes', async () => {
      mockFetchOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: false })
      } as Response);
      const client = buildClient();
      const result = await client.verifyToken('bad-token');
      assert(!result.success);
      expect(result.error.internalMessage).toContain('unknown');
    });

    it('returns success when API responds with success=true', async () => {
      mockFetchOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, hostname: 'example.com' })
      } as Response);
      const client = buildClient();
      const result = await client.verifyToken('valid-token');
      expect(result.success).toBe(true);
    });

    it('fails closed when API returns 200 with malformed JSON', async () => {
      mockFetchOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        }
      } as Response);
      const client = buildClient();
      const result = await client.verifyToken('valid-token');
      assert(!result.success);
      expect(result.error.internalMessage).toContain('Unexpected token');
    });

    it('fails closed when fetch is aborted (timeout)', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      mockFetchReject(abortError);

      const client = buildClient();
      const result = await client.verifyToken('valid-token');
      assert(!result.success);
      expect(result.error.internalMessage).toContain('timed out');
    });

    it('passes secret, response, and remoteIp to Turnstile API', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      } as Response);
      vi.stubGlobal('fetch', fetchMock);

      const client = buildClient();
      await client.verifyToken('token-abc', '203.0.113.5');

      expect(fetchMock).toHaveBeenCalledWith(
        TURNSTILE_VERIFY_URL,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        })
      );
      const body = fetchMock.mock.calls[0][1].body as string;
      expect(body).toContain('secret=test-secret');
      expect(body).toContain('response=token-abc');
      expect(body).toContain('remoteip=203.0.113.5');
    });

    it('omits remoteIp from request body when not provided', async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true })
      } as Response);
      vi.stubGlobal('fetch', fetchMock);

      const client = buildClient();
      await client.verifyToken('token-abc');

      const body = fetchMock.mock.calls[0][1].body as string;
      expect(body).not.toContain('remoteip');
    });
  });
});

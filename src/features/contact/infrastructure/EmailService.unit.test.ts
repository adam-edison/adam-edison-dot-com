import { expect, test, describe, vi, beforeEach } from 'vitest';
import { EmailService } from './EmailService';
import { ContactFormData } from '../ContactFormValidator';
import { SecurityTokens } from '../types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockFormData: ContactFormData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  message: 'This is a test message that meets the minimum character requirement for testing purposes.'
};

const mockTokens: SecurityTokens = {
  csrfToken: 'test-csrf-token',
  turnstileToken: 'test-turnstile-token'
};

describe('EmailService', () => {
  let emailService: EmailService;

  beforeEach(() => {
    vi.clearAllMocks();
    emailService = new EmailService('http://localhost:3000');
  });

  test('should send email successfully with tokens', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true
    });

    const result = await emailService.send(mockFormData, mockTokens);

    expect(result.success).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...mockFormData,
        csrfToken: 'test-csrf-token',
        turnstileToken: 'test-turnstile-token'
      })
    });
  });

  test('should handle API error response with message', async () => {
    const errorResponse = { message: 'Rate limit exceeded' };
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue(errorResponse)
    });

    const result = await emailService.send(mockFormData, mockTokens);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Rate limit exceeded');
    }
  });

  test('should handle API error response without message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({})
    });

    const result = await emailService.send(mockFormData, mockTokens);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Request failed with status 500');
    }
  });

  test('should handle JSON parsing error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    });

    const result = await emailService.send(mockFormData, mockTokens);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Request failed with status 500');
    }
  });

  test('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network connection failed'));

    const result = await emailService.send(mockFormData, mockTokens);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Network connection failed');
    }
  });

  test('should handle non-Error exceptions', async () => {
    mockFetch.mockRejectedValueOnce('Unknown error');

    const result = await emailService.send(mockFormData, mockTokens);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Network error occurred');
    }
  });

  test('should use default baseUrl when not provided', () => {
    const defaultService = new EmailService();

    mockFetch.mockResolvedValueOnce({ ok: true });

    defaultService.send(mockFormData, mockTokens);

    expect(mockFetch).toHaveBeenCalledWith('/api/contact', expect.any(Object));
  });

  test('should include only csrfToken when turnstileToken is undefined', async () => {
    const tokensWithoutTurnstile: SecurityTokens = {
      csrfToken: 'test-csrf-token'
    };

    mockFetch.mockResolvedValueOnce({ ok: true });

    await emailService.send(mockFormData, tokensWithoutTurnstile);

    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...mockFormData,
        csrfToken: 'test-csrf-token',
        turnstileToken: undefined
      })
    });
  });
});

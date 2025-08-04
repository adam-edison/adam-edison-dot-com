import { expect, test, describe, vi, beforeEach } from 'vitest';
import { ConfigService } from './ConfigService';
import { ServiceConfig } from '../types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockServiceConfig: ServiceConfig = {
  status: 'healthy',
  services: {
    email: { enabled: true, ready: true },
    turnstile: { enabled: true, ready: true, siteKey: 'test-site-key' }
  }
};

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    vi.clearAllMocks();
    configService = new ConfigService('http://localhost:3000');
  });

  test('should fetch service configuration successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockServiceConfig)
    });

    const result = await configService.getServiceConfig();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(mockServiceConfig);
    }
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/email-service-check');
  });

  test('should handle API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    const result = await configService.getServiceConfig();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Failed to check server configuration');
    }
  });

  test('should handle network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

    const result = await configService.getServiceConfig();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Connection failed');
    }
  });

  test('should handle non-Error exceptions', async () => {
    mockFetch.mockRejectedValueOnce('Unknown error');

    const result = await configService.getServiceConfig();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Network error getting service configuration');
    }
  });

  test('should handle JSON parsing error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
    });

    const result = await configService.getServiceConfig();

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe('Invalid JSON');
    }
  });

  test('should use default baseUrl when not provided', () => {
    const defaultService = new ConfigService();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(mockServiceConfig)
    });

    defaultService.getServiceConfig();

    expect(mockFetch).toHaveBeenCalledWith('/api/email-service-check');
  });

  test('should handle degraded service status', async () => {
    const degradedConfig: ServiceConfig = {
      status: 'degraded',
      services: {
        email: { enabled: true, ready: false },
        turnstile: { enabled: false, ready: false }
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue(degradedConfig)
    });

    const result = await configService.getServiceConfig();

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('degraded');
      expect(result.data.services.email.ready).toBe(false);
    }
  });
});

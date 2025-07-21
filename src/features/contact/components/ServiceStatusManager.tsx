import { useState, useEffect } from 'react';
import { Result } from '@/shared/Result';
import { logger } from '@/shared/Logger';

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'error';
  services: {
    email: {
      enabled: boolean;
      ready: boolean;
    };
    turnstile: {
      enabled: boolean;
      ready: boolean;
      siteKey?: string;
    };
  };
}

export interface ServiceStatusData {
  serviceStatus: ServiceStatus | null;
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useServiceStatus(): ServiceStatusData {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceData = async (): Promise<Result<{ csrfToken: string; serviceStatus: ServiceStatus }, string>> => {
    try {
      // Fetch both CSRF token and service status concurrently
      const [csrfResponse, serviceResponse] = await Promise.all([
        fetch('/api/csrf-token'),
        fetch('/api/email-service-check')
      ]);

      if (!csrfResponse.ok) {
        return Result.failure('Failed to fetch security token');
      }
      if (!serviceResponse.ok) {
        return Result.failure('Failed to fetch service status');
      }

      const [csrfData, serviceData] = await Promise.all([csrfResponse.json(), serviceResponse.json()]);

      return Result.success({
        csrfToken: csrfData.token,
        serviceStatus: serviceData
      });
    } catch (error) {
      logger.error('Service status fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load form services';
      return Result.failure(errorMessage);
    }
  };

  useEffect(() => {
    const initializeServices = async () => {
      setIsLoading(true);
      setError(null);

      const result = await fetchServiceData();

      if (result.success) {
        setCsrfToken(result.data.csrfToken);
        setServiceStatus(result.data.serviceStatus);
      } else {
        setError(result.error);
      }

      setIsLoading(false);
    };

    initializeServices();
  }, []);

  return {
    serviceStatus,
    csrfToken,
    isLoading,
    error
  };
}

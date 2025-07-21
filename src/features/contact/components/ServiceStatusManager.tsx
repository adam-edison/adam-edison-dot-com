import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch both CSRF token and service status concurrently
        const [csrfResponse, serviceResponse] = await Promise.all([
          fetch('/api/csrf-token'),
          fetch('/api/email-service-check')
        ]);

        if (!csrfResponse.ok) {
          throw new Error('Failed to fetch security token');
        }
        if (!serviceResponse.ok) {
          throw new Error('Failed to fetch service status');
        }

        const [csrfData, serviceData] = await Promise.all([csrfResponse.json(), serviceResponse.json()]);

        setCsrfToken(csrfData.token);
        setServiceStatus(serviceData);
      } catch (error) {
        logger.error('Service status fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load form services';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceData();
  }, []);

  return {
    serviceStatus,
    csrfToken,
    isLoading,
    error
  };
}

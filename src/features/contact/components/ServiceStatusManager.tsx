import { useState, useEffect } from 'react';
import { Result } from '@/shared/Result';
import { logger } from '@/shared/Logger';
import { ContactFormService, ServiceStatus } from '../ContactFormService';

export interface ServiceStatusData {
  serviceStatus: ServiceStatus | null;
  csrfToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useServiceStatus(contactService: ContactFormService): ServiceStatusData {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceData = async (): Promise<Result<{ csrfToken: string; serviceStatus: ServiceStatus }, string>> => {
      try {
        // Fetch both CSRF token and service status concurrently
        const [csrfToken, serviceStatus] = await Promise.all([
          contactService.getCsrfToken(),
          contactService.checkServerConfig()
        ]);

        return Result.success({
          csrfToken,
          serviceStatus
        });
      } catch (error) {
        logger.error('Service status fetch error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load form services';
        return Result.failure(errorMessage);
      }
    };

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
  }, [contactService]);

  return {
    serviceStatus,
    csrfToken,
    isLoading,
    error
  };
}

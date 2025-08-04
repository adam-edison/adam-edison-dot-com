import { Result } from '@/shared/Result';
import { ServiceConfig } from '../types';

export class ConfigService {
  constructor(private baseUrl: string = '') {}

  async getServiceConfig(): Promise<Result<ServiceConfig, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/api/email-service-check`);

      if (!response.ok) {
        return Result.failure('Failed to check server configuration');
      }

      const config = await response.json();

      return Result.success(config);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error getting service configuration';

      return Result.failure(errorMessage);
    }
  }
}

import { Result } from '@/shared/Result';
import { ContactFormData } from './ContactFormValidator';
import { ServiceConfig } from './types';
import { EmailService } from './infrastructure/EmailService';
import { SecurityService } from './infrastructure/SecurityService';
import { ConfigService } from './infrastructure/ConfigService';

export class ContactFormService {
  constructor(
    private emailService: EmailService,
    private securityService: SecurityService,
    private configService: ConfigService
  ) {}

  async getConfig(): Promise<Result<ServiceConfig, string>> {
    return this.configService.getServiceConfig();
  }

  async submit(formData: ContactFormData): Promise<Result<void, string>> {
    const tokensResult = await this.securityService.getTokens();
    if (!tokensResult.success) {
      return Result.failure(tokensResult.error);
    }

    const sendResult = await this.emailService.send(formData, tokensResult.data);
    if (sendResult.success) {
      await this.securityService.resetTokens();
      return Result.success();
    }

    if (!this.isCsrfError(sendResult.error)) {
      return sendResult;
    }

    return this.retryWithFreshCsrfToken(formData, sendResult.error);
  }

  private async retryWithFreshCsrfToken(
    formData: ContactFormData,
    originalError: string
  ): Promise<Result<void, string>> {
    const refreshResult = await this.securityService.refreshCsrfToken();
    if (!refreshResult.success) {
      return Result.failure(originalError);
    }

    const freshTokensResult = await this.securityService.getTokens();
    if (!freshTokensResult.success) {
      return Result.failure(freshTokensResult.error);
    }

    const retryResult = await this.emailService.send(formData, freshTokensResult.data);
    if (retryResult.success) {
      await this.securityService.resetTokens();
    }

    return retryResult;
  }

  private isCsrfError(error: string): boolean {
    const lowerError = error.toLowerCase();
    return (
      error.includes('403') ||
      lowerError.includes('forbidden') ||
      lowerError.includes('csrf') ||
      lowerError.includes('token')
    );
  }

  static create(baseUrl: string = ''): ContactFormService {
    const emailService = new EmailService(baseUrl);
    const securityService = new SecurityService(baseUrl);
    const configService = new ConfigService(baseUrl);

    return new ContactFormService(emailService, securityService, configService);
  }
}

export const defaultContactFormService = ContactFormService.create();

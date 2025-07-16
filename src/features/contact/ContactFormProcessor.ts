import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { RecaptchaService } from './RecaptchaService';
import { ContactFormValidator, ContactFormSubmissionData, ContactFormServerData } from './ContactFormValidator';
import { Result } from '@/shared/Result';
import {
  ValidationError,
  RecaptchaError,
  SanitizationError,
  EmailServiceError,
  ServiceUnavailableError
} from '@/shared/errors';

export type ProcessFormResult = Result<
  void,
  ValidationError | RecaptchaError | SanitizationError | EmailServiceError | ServiceUnavailableError
>;

export class ContactFormProcessor {
  constructor(
    private emailService: EmailService,
    private recaptchaService: RecaptchaService
  ) {}

  static async fromEnv(): Promise<Result<ContactFormProcessor, EmailServiceError>> {
    const emailServiceResult = EmailService.fromEnv();
    if (!emailServiceResult.success) {
      return Result.failure(emailServiceResult.error);
    }

    const recaptchaService = RecaptchaService.fromEnv();

    return Result.success(new ContactFormProcessor(emailServiceResult.data, recaptchaService));
  }

  async processForm(formData: unknown): Promise<ProcessFormResult> {
    const rawSubmission = formData;
    const validatedSubmission = await this.validateRawSubmission(rawSubmission);
    if (!validatedSubmission.success) return Result.failure(validatedSubmission.error);

    const recaptchaToken = validatedSubmission.data.recaptchaToken;
    const recaptchaVerified = await this.verifyRecaptchaToken(recaptchaToken);
    if (!recaptchaVerified.success) return Result.failure(recaptchaVerified.error);

    const formDataWithoutToken = validatedSubmission.data;
    const sanitizedFormData = this.sanitizeFormData(formDataWithoutToken);
    const serverValidatedData = await this.validateSanitizedData(sanitizedFormData);
    if (!serverValidatedData.success) return Result.failure(serverValidatedData.error);

    const emailData = serverValidatedData.data;
    const emailSent = await this.sendContactEmail(emailData);
    if (!emailSent.success) return Result.failure(emailSent.error);

    return Result.success();
  }

  private async validateRawSubmission(rawData: unknown): Promise<Result<ContactFormSubmissionData, ValidationError>> {
    return ContactFormValidator.validateSubmissionData(rawData);
  }

  private async verifyRecaptchaToken(token: string): Promise<Result<void, RecaptchaError>> {
    const result = await this.recaptchaService.verifyToken(token);
    return result.success ? Result.success() : Result.failure(new RecaptchaError('reCAPTCHA verification failed'));
  }

  private sanitizeFormData(submissionData: ContactFormSubmissionData): ContactFormServerData {
    return {
      firstName: InputSanitizer.sanitize(submissionData.firstName),
      lastName: InputSanitizer.sanitize(submissionData.lastName),
      email: InputSanitizer.sanitize(submissionData.email),
      message: InputSanitizer.sanitize(submissionData.message)
    };
  }

  private async validateSanitizedData(
    sanitizedData: ContactFormServerData
  ): Promise<Result<ContactFormServerData, SanitizationError>> {
    const result = ContactFormValidator.validateServerData(sanitizedData);
    return result.success
      ? result
      : Result.failure(new SanitizationError('Data validation failed after sanitization', result.error.details));
  }

  private async sendContactEmail(emailData: ContactFormServerData): Promise<Result<void, EmailServiceError>> {
    const emailResult = await this.emailService.sendContactEmail(emailData);
    return emailResult.success ? Result.success() : Result.failure(emailResult.error);
  }
}

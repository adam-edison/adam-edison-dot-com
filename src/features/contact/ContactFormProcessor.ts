import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { recaptchaService } from './RecaptchaService';
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
  static async processForm(formData: unknown): Promise<ProcessFormResult> {
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

  private static async validateRawSubmission(
    rawData: unknown
  ): Promise<Result<ContactFormSubmissionData, ValidationError>> {
    return ContactFormValidator.validateSubmissionData(rawData);
  }

  private static async verifyRecaptchaToken(token: string): Promise<Result<void, RecaptchaError>> {
    const result = await recaptchaService.verifyToken(token);
    return result.success ? Result.success() : Result.failure(new RecaptchaError('reCAPTCHA verification failed'));
  }

  private static sanitizeFormData(submissionData: ContactFormSubmissionData): ContactFormServerData {
    return {
      firstName: InputSanitizer.sanitize(submissionData.firstName),
      lastName: InputSanitizer.sanitize(submissionData.lastName),
      email: InputSanitizer.sanitize(submissionData.email),
      message: InputSanitizer.sanitize(submissionData.message)
    };
  }

  private static async validateSanitizedData(
    sanitizedData: ContactFormServerData
  ): Promise<Result<ContactFormServerData, SanitizationError>> {
    const result = ContactFormValidator.validateServerData(sanitizedData);
    return result.success
      ? result
      : Result.failure(new SanitizationError('Data validation failed after sanitization', result.error.details));
  }

  private static async sendContactEmail(emailData: ContactFormServerData): Promise<Result<void, EmailServiceError>> {
    const emailService = EmailService.fromEnv();
    if (!emailService.success) return Result.failure(emailService.error);

    const emailResult = await emailService.data.sendContactEmail(emailData);
    return emailResult.success ? Result.success() : Result.failure(emailResult.error);
  }
}

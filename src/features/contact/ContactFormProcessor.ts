import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { recaptchaService } from './RecaptchaService';
import { ContactFormValidator, ContactFormSubmissionData } from './ContactFormValidator';
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
    const validationResult = ContactFormValidator.validateSubmissionData(formData);
    if (!validationResult.success) {
      return Result.failure(validationResult.error);
    }

    const recaptchaResult = await recaptchaService.verifyToken(validationResult.data.recaptchaToken);
    if (!recaptchaResult.success) {
      return Result.failure(new RecaptchaError('reCAPTCHA verification failed'));
    }

    const sanitizedData = this.sanitizeFormData(validationResult.data);
    const sanitizationResult = ContactFormValidator.validateServerData(sanitizedData);
    if (!sanitizationResult.success) {
      return Result.failure(
        new SanitizationError('Data validation failed after sanitization', sanitizationResult.error.details)
      );
    }

    const emailServiceResult = EmailService.fromEnv();
    if (!emailServiceResult.success) {
      return Result.failure(emailServiceResult.error);
    }

    const emailResult = await emailServiceResult.data.sendContactEmail(sanitizationResult.data);
    if (!emailResult.success) {
      return Result.failure(emailResult.error);
    }

    return Result.success(undefined);
  }

  private static sanitizeFormData(formData: ContactFormSubmissionData) {
    return {
      firstName: InputSanitizer.sanitize(formData.firstName),
      lastName: InputSanitizer.sanitize(formData.lastName),
      email: InputSanitizer.sanitize(formData.email),
      message: InputSanitizer.sanitize(formData.message)
    };
  }
}

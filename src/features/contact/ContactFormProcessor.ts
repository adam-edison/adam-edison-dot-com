import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { RecaptchaService } from './RecaptchaService';
import { ContactFormValidator, ContactFormData } from './ContactFormValidator';
import { Result } from '@/shared/Result';
import { ValidationError, RecaptchaError, InternalServerError } from '@/shared/errors';

export type ProcessFormResult = Result<void, ValidationError | RecaptchaError | InternalServerError>;

export class ContactFormProcessor {
  constructor(
    private emailService: EmailService,
    private recaptchaService: RecaptchaService
  ) {}

  static async fromEnv(): Promise<Result<ContactFormProcessor, InternalServerError>> {
    const emailServiceResult = EmailService.fromEnv();

    if (!emailServiceResult.success) {
      const internalMessage = `Failed to initialize email service: ${emailServiceResult.error.message}`;
      const clientMessage = 'Internal server error';
      const serverError = new InternalServerError(clientMessage, { internalMessage });
      return Result.failure(serverError);
    }

    const recaptchaService = RecaptchaService.fromEnv();

    const contactFormProcessor = new ContactFormProcessor(emailServiceResult.data, recaptchaService);
    return Result.success(contactFormProcessor);
  }

  async processForm(formData: unknown): Promise<ProcessFormResult> {
    const recaptchaToken = ContactFormValidator.extractRecaptchaToken(formData);
    if (!recaptchaToken) {
      const clientMessage = 'Please complete the reCAPTCHA verification';
      const validationError = new ValidationError(clientMessage, { internalMessage: 'Missing recaptcha token' });
      return Result.failure(validationError);
    }

    const recaptchaVerified = await this.verifyRecaptchaToken(recaptchaToken);
    if (!recaptchaVerified.success) return Result.failure(recaptchaVerified.error);

    const formDataOnly = ContactFormValidator.extractFormData(formData);
    const validatedFormData = ContactFormValidator.validate(formDataOnly);
    if (!validatedFormData.success) return Result.failure(validatedFormData.error);

    const sanitizedFormData = this.sanitizeFormData(validatedFormData.data);

    if (!this.emailService.getConfiguration().sendEmailEnabled) return Result.success();

    const emailSent = await this.sendContactEmail(sanitizedFormData);
    if (!emailSent.success) return Result.failure(emailSent.error);

    return Result.success();
  }

  private async verifyRecaptchaToken(token: string): Promise<Result<void, RecaptchaError>> {
    const result = await this.recaptchaService.verifyToken(token);
    if (result.success) {
      return Result.success();
    }

    const clientMessage = 'Security verification failed. Please try again.';
    const errorDetails = result.error.message || 'Unknown reCAPTCHA error';
    const internalMessage = `reCAPTCHA verification failed: ${errorDetails}`;
    const recaptchaError = new RecaptchaError(clientMessage, { internalMessage });

    return Result.failure(recaptchaError);
  }

  private sanitizeFormData(formData: ContactFormData): ContactFormData {
    return {
      firstName: InputSanitizer.sanitize(formData.firstName),
      lastName: InputSanitizer.sanitize(formData.lastName),
      email: InputSanitizer.sanitize(formData.email),
      message: InputSanitizer.sanitize(formData.message)
    };
  }

  private async sendContactEmail(emailData: ContactFormData): Promise<Result<void, InternalServerError>> {
    const emailResult = await this.emailService.sendContactEmail(emailData);

    if (emailResult.success) return Result.success();

    const internalMessage = `Email service error: ${emailResult.error.message}`;
    const clientMessage = 'Failed to send message. Please try again later.';
    const serverError = new InternalServerError(clientMessage, { internalMessage });
    return Result.failure(serverError);
  }
}

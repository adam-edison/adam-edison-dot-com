import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { RecaptchaService } from './RecaptchaService';
import { ContactFormValidator, ContactFormSubmissionData, ContactFormServerData } from './ContactFormValidator';
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

    if (!this.emailService.getConfiguration().sendEmailEnabled) return Result.success();

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
    if (result.success) {
      return Result.success();
    }

    const clientMessage = 'Security verification failed. Please try again.';
    const errorDetails = result.error.message || 'Unknown reCAPTCHA error';
    const internalMessage = `reCAPTCHA verification failed: ${errorDetails}`;
    const recaptchaError = new RecaptchaError(clientMessage, { internalMessage });

    return Result.failure(recaptchaError);
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
  ): Promise<Result<ContactFormServerData, ValidationError>> {
    const result = ContactFormValidator.validateServerData(sanitizedData);

    if (result.success) return result;

    const clientMessage = 'Invalid content detected. Please check your input and try again.';
    const internalMessage = `Data validation failed after sanitization: ${result.error.message}`;
    const validationError = new ValidationError(clientMessage, { internalMessage, details: result.error.details });

    return Result.failure(validationError);
  }

  private async sendContactEmail(emailData: ContactFormServerData): Promise<Result<void, InternalServerError>> {
    const emailResult = await this.emailService.sendContactEmail(emailData);

    if (emailResult.success) return Result.success();

    const internalMessage = `Email service error: ${emailResult.error.message}`;
    const clientMessage = 'Failed to send message. Please try again later.';
    const serverError = new InternalServerError(clientMessage, { internalMessage });
    return Result.failure(serverError);
  }
}

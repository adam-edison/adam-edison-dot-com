import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { AntiBotService, type AntiBotData } from './AntiBotService';
import { ContactFormValidator, ContactFormData } from './ContactFormValidator';
import { Result } from '@/shared/Result';
import { ValidationError, InternalServerError } from '@/shared/errors';

export type ProcessFormResult = Result<void, ValidationError | InternalServerError>;

export class ContactFormProcessor {
  constructor(
    private emailService: EmailService,
    private antiBotService: AntiBotService
  ) {}

  static async fromEnv(): Promise<Result<ContactFormProcessor, InternalServerError>> {
    const emailServiceResult = EmailService.fromEnv();

    if (!emailServiceResult.success) {
      const internalMessage = `Failed to initialize email service: ${emailServiceResult.error.message}`;
      const clientMessage = 'Internal server error';
      const serverError = new InternalServerError(clientMessage, { internalMessage });
      return Result.failure(serverError);
    }

    const antiBotService = AntiBotService.create();

    const contactFormProcessor = new ContactFormProcessor(emailServiceResult.data, antiBotService);
    return Result.success(contactFormProcessor);
  }

  async processForm(formData: unknown): Promise<ProcessFormResult> {
    const antiBotData = ContactFormValidator.extractAntiBotData(formData);
    if (!antiBotData) {
      const clientMessage = 'Security verification data missing';
      const validationError = new ValidationError(clientMessage, { internalMessage: 'Missing anti-bot data' });
      return Result.failure(validationError);
    }

    const antiBotVerified = this.verifyAntiBotData(antiBotData as AntiBotData);
    if (!antiBotVerified.success) return Result.failure(antiBotVerified.error);

    const formDataOnly = ContactFormValidator.extractFormData(formData);
    const validatedFormData = ContactFormValidator.validate(formDataOnly);
    if (!validatedFormData.success) return Result.failure(validatedFormData.error);

    const sanitizedFormData = this.sanitizeFormData(validatedFormData.data);

    if (!this.emailService.getConfiguration().sendEmailEnabled) return Result.success();

    const emailSent = await this.sendContactEmail(sanitizedFormData);
    if (!emailSent.success) return Result.failure(emailSent.error);

    return Result.success();
  }

  private verifyAntiBotData(antiBotData: AntiBotData): Result<void, ValidationError> {
    const result = this.antiBotService.validateAntiBotData(antiBotData);
    if (result.isValid) {
      return Result.success();
    }

    const clientMessage = result.reason || 'Security verification failed. Please try again.';
    const internalMessage = `Anti-bot verification failed: ${result.reason}`;
    const validationError = new ValidationError(clientMessage, { internalMessage });

    return Result.failure(validationError);
  }

  private sanitizeFormData(formData: ContactFormData): ContactFormData {
    return {
      firstName: InputSanitizer.sanitize(formData.firstName),
      lastName: InputSanitizer.sanitize(formData.lastName),
      email: InputSanitizer.sanitize(formData.email),
      message: InputSanitizer.sanitize(formData.message),
      subject: formData.subject,
      phone: formData.phone,
      mathAnswer: formData.mathAnswer,
      formLoadTime: formData.formLoadTime,
      mathNum1: formData.mathNum1,
      mathNum2: formData.mathNum2
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

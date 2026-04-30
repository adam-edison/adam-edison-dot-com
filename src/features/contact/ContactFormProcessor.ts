import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { TurnstileClient } from './TurnstileClient';
import { ContactFormValidator, ContactFormData } from './ContactFormValidator';
import { Result } from '@/shared/Result';
import { ValidationError, TurnstileError, InternalServerError, ServiceUnavailableError } from '@/shared/errors';

export type ProcessFormResult = Result<
  void,
  ValidationError | TurnstileError | ServiceUnavailableError | InternalServerError
>;

export interface ProcessFormOptions {
  remoteIp?: string;
}

export class ContactFormProcessor {
  constructor(
    private emailService: EmailService,
    private turnstileClient: TurnstileClient
  ) {}

  static async fromEnv(
    env: NodeJS.ProcessEnv = process.env
  ): Promise<Result<ContactFormProcessor, InternalServerError | ServiceUnavailableError>> {
    const emailServiceResult = EmailService.fromEnv(env);

    if (!emailServiceResult.success) {
      const internalMessage = `Failed to initialize email service: ${emailServiceResult.error.message}`;
      const clientMessage = 'Internal server error';
      const serverError = new InternalServerError(clientMessage, { internalMessage });
      return Result.failure(serverError);
    }

    const turnstileResult = TurnstileClient.fromEnv(env);
    if (!turnstileResult.success) return Result.failure(turnstileResult.error);

    const contactFormProcessor = new ContactFormProcessor(emailServiceResult.data, turnstileResult.data);
    return Result.success(contactFormProcessor);
  }

  async processForm(formData: unknown, options: ProcessFormOptions = {}): Promise<ProcessFormResult> {
    const turnstileToken = ContactFormValidator.extractTurnstileToken(formData);
    if (!turnstileToken) {
      const clientMessage = 'Please complete the captcha verification';
      const validationError = new ValidationError(clientMessage, { internalMessage: 'Missing turnstile token' });
      return Result.failure(validationError);
    }

    const verified = await this.turnstileClient.verifyToken(turnstileToken, options.remoteIp);
    if (!verified.success) return Result.failure(verified.error);

    const formDataOnly = ContactFormValidator.extractFormData(formData);
    const validatedFormData = ContactFormValidator.validate(formDataOnly);
    if (!validatedFormData.success) return Result.failure(validatedFormData.error);

    const sanitizedFormData = this.sanitizeFormData(validatedFormData.data);

    if (!this.emailService.getConfiguration().sendEmailEnabled) return Result.success();

    const emailSent = await this.sendContactEmail(sanitizedFormData);
    if (!emailSent.success) return Result.failure(emailSent.error);

    return Result.success();
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

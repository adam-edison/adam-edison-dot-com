import { EmailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { TurnstileService } from './TurnstileService';
import { ContactFormValidator, ContactFormData } from './ContactFormValidator';
import { Result } from '@/shared/Result';
import { ValidationError, InternalServerError } from '@/shared/errors';
import { isFormDataWithTurnstile } from '@/shared/TypeGuards';

export type ProcessFormResult = Result<void, ValidationError | InternalServerError>;

export class ContactFormProcessor {
  constructor(
    private emailService: EmailService,
    private turnstileService?: TurnstileService
  ) {}

  static async fromEnv(): Promise<Result<ContactFormProcessor, InternalServerError>> {
    const emailServiceResult = EmailService.fromEnv();

    if (!emailServiceResult.success) {
      const internalMessage = `Failed to initialize email service: ${emailServiceResult.error.message}`;
      const clientMessage = 'Internal server error';
      const serverError = new InternalServerError(clientMessage, { internalMessage });
      return Result.failure(serverError);
    }

    // Initialize Turnstile service if enabled
    let turnstileService: TurnstileService | undefined;
    if (TurnstileService.isEnabled()) {
      const turnstileResult = TurnstileService.fromEnv();
      if (!turnstileResult.success) {
        return Result.failure(turnstileResult.error);
      }
      turnstileService = turnstileResult.data;
    }

    const contactFormProcessor = new ContactFormProcessor(emailServiceResult.data, turnstileService);
    return Result.success(contactFormProcessor);
  }

  async processForm(formData: unknown, remoteIp?: string): Promise<ProcessFormResult> {
    // Extract Turnstile token if present
    let turnstileToken: string | undefined;
    if (isFormDataWithTurnstile(formData)) {
      turnstileToken = formData.turnstileToken;
      // Remove token from form data before validation
      delete formData.turnstileToken;
    }

    // Verify Turnstile token if service is enabled
    if (this.turnstileService) {
      if (!turnstileToken) {
        const error = new ValidationError('Security verification required', {
          internalMessage: 'Turnstile token is missing but Turnstile is enabled'
        });
        return Result.failure(error);
      }

      const verificationResult = await this.turnstileService.verifyToken(turnstileToken, remoteIp);
      if (!verificationResult.success) {
        return Result.failure(verificationResult.error);
      }
    }

    const validatedFormData = ContactFormValidator.validate(formData);
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

    if (!emailResult.success) {
      const internalMessage = `Email service error: ${emailResult.error.message}`;
      const clientMessage = 'Failed to send message. Please try again later.';
      const serverError = new InternalServerError(clientMessage, { internalMessage });
      return Result.failure(serverError);
    }

    return Result.success();
  }
}

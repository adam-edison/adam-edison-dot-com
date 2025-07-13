import { emailService } from './EmailService';
import { InputSanitizer } from './InputSanitizer';
import { recaptchaService } from './RecaptchaService';
import { ContactFormValidator, ContactFormSubmissionData } from './ContactFormValidator';
import { logger } from '@/shared/Logger';

export interface ProcessFormResult {
  success: boolean;
  error?: {
    type: 'validation' | 'recaptcha' | 'sanitization' | 'email' | 'server';
    message: string;
    errors?: unknown[];
  };
}

interface ValidationResult {
  success: boolean;
  data?: ContactFormSubmissionData;
  error?: ProcessFormResult['error'];
}

export class ContactFormProcessor {
  static async processForm(formData: unknown): Promise<ProcessFormResult> {
    const validationResult = this.validateFormData(formData);
    if (!validationResult.success || !validationResult.data) {
      return {
        success: false,
        error: validationResult.error
      };
    }

    const { recaptchaToken, ...formDataOnly } = validationResult.data;
    const recaptchaResult = await this.verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return recaptchaResult;
    }

    const sanitizedData = this.sanitizeFormData(formDataOnly);

    const sanitizationResult = this.validateSanitizedData(sanitizedData);
    if (!sanitizationResult.success) {
      return sanitizationResult;
    }

    return this.attemptEmailSend(sanitizedData);
  }

  private static validateFormData(formData: unknown): ValidationResult {
    const validationResult = ContactFormValidator.validateSubmissionData(formData);
    if (!validationResult.success) {
      logger.error('Contact form validation failed:', validationResult.error.errors);
      return {
        success: false,
        error: {
          type: 'validation',
          message: 'Invalid form data',
          errors: validationResult.error.errors
        }
      };
    }

    return { success: true, data: validationResult.data };
  }

  private static async verifyRecaptcha(recaptchaToken: string): Promise<ProcessFormResult> {
    const isValidRecaptcha = await recaptchaService.verifyToken(recaptchaToken);

    if (!isValidRecaptcha) {
      logger.error('reCAPTCHA verification failed');
      return {
        success: false,
        error: {
          type: 'recaptcha',
          message: 'reCAPTCHA verification failed'
        }
      };
    }

    return { success: true };
  }

  private static sanitizeFormData(formData: Omit<ContactFormSubmissionData, 'recaptchaToken'>) {
    return {
      firstName: InputSanitizer.sanitize(formData.firstName),
      lastName: InputSanitizer.sanitize(formData.lastName),
      email: InputSanitizer.sanitize(formData.email),
      message: InputSanitizer.sanitize(formData.message)
    };
  }

  private static validateSanitizedData(sanitizedData: ReturnType<typeof this.sanitizeFormData>): ProcessFormResult {
    const serverValidationResult = ContactFormValidator.validateServerData(sanitizedData);

    if (!serverValidationResult.success) {
      logger.error('Server validation failed after sanitization:', serverValidationResult.error.errors);

      return {
        success: false,
        error: {
          type: 'sanitization',
          message: 'Invalid form data after sanitization',
          errors: serverValidationResult.error.errors
        }
      };
    }

    return { success: true };
  }

  private static async attemptEmailSend(
    sanitizedData: ReturnType<typeof this.sanitizeFormData>
  ): Promise<ProcessFormResult> {
    try {
      await emailService.sendContactEmail(sanitizedData);
      return { success: true };
    } catch (error) {
      return this.handleEmailError(error);
    }
  }

  private static handleEmailError(error: unknown): ProcessFormResult {
    logger.error('Contact form processing error:', error);

    if (this.isConfigurationError(error)) {
      return {
        success: false,
        error: {
          type: 'server',
          message: 'Server configuration error'
        }
      };
    }

    return {
      success: false,
      error: {
        type: 'server',
        message: 'Failed to send message. Please try again later.'
      }
    };
  }

  private static isConfigurationError(error: unknown): boolean {
    return (
      error instanceof Error && (error.message.includes('configuration') || error.message.includes('not configured'))
    );
  }
}

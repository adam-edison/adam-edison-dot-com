import { z } from 'zod';
import { ValidationPatterns } from '@/shared/patterns/ValidationPatterns';
import { FormValidationConstants } from '@/shared/constants/FormValidationConstants';
import { Result } from '@/shared/Result';
import { ValidationError } from '@/shared/errors';

// Extract constants for better readability
const nameMinLength = FormValidationConstants.NAME_MIN_LENGTH;
const nameMaxLength = FormValidationConstants.NAME_MAX_LENGTH;

const nonWhitespaceString = (minLength: number, maxLength: number) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .refine((val) => val.trim().length >= minLength, {
      message: `Must contain at least ${minLength} non-whitespace characters`
    });

const baseContactSchema = z.object({
  firstName: z
    .string()
    .min(nameMinLength, `First name must be at least ${nameMinLength} characters`)
    .max(nameMaxLength, `First name must be at most ${nameMaxLength} characters`)
    .refine((val) => {
      // Must contain at least one letter (Unicode letter category)
      return ValidationPatterns.UNICODE_LETTER.test(val);
    }, 'First name must contain at least one letter')
    .refine((val) => {
      // Cannot be purely numbers
      return !ValidationPatterns.ONLY_DIGITS.test(val);
    }, 'First name cannot be only numbers')
    .refine((val) => {
      // Cannot be purely symbols/punctuation
      return !ValidationPatterns.ONLY_SYMBOLS.test(val);
    }, 'First name cannot be only symbols'),
  lastName: z
    .string()
    .min(nameMinLength, `Last name must be at least ${nameMinLength} characters`)
    .max(nameMaxLength, `Last name must be at most ${nameMaxLength} characters`)
    .refine((val) => {
      // Must contain at least one letter (Unicode letter category)
      return ValidationPatterns.UNICODE_LETTER.test(val);
    }, 'Last name must contain at least one letter')
    .refine((val) => {
      // Cannot be purely numbers
      return !ValidationPatterns.ONLY_DIGITS.test(val);
    }, 'Last name cannot be only numbers')
    .refine((val) => {
      // Cannot be purely symbols/punctuation
      return !ValidationPatterns.ONLY_SYMBOLS.test(val);
    }, 'Last name cannot be only symbols'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be at most 100 characters')
    .refine((email) => {
      // Additional validation: check for common email patterns
      return ValidationPatterns.EMAIL_FORMAT.test(email);
    }, 'Please enter a valid email address')
    .refine((email) => {
      // Prevent obvious fake emails
      const fakePatterns = ['test@test', 'example@example', 'user@user', 'admin@admin'];
      return !fakePatterns.some((pattern) => email.toLowerCase().includes(pattern));
    }, 'Please enter a valid email address')
    .refine((email) => {
      return !ValidationPatterns.CONSECUTIVE_DOTS.test(email);
    }, 'Please enter a valid email address')
    .refine((email) => {
      const parts = email.split('@');
      if (parts.length !== 2) return false;
      const domain = parts[1];
      const domainParts = domain.split('.');
      return domainParts.length >= 2 && domainParts[domainParts.length - 1].length >= 2;
    }, 'Please enter a valid email address'),
  message: nonWhitespaceString(50, 1000)
});

export type ContactFormData = z.infer<typeof baseContactSchema>;
export type ContactFormSubmissionData = ContactFormData & { recaptchaToken: string };
export type ContactFormServerData = ContactFormData;

export class ContactFormValidator {
  static readonly clientFormValidationSchema = baseContactSchema;

  static readonly clientSubmissionSchema = baseContactSchema.extend({
    recaptchaToken: z.string().min(1, 'Please complete the reCAPTCHA verification')
  });

  static readonly serverProcessingSchema = baseContactSchema;

  /**
   * Validates form data for client-side use (without reCAPTCHA)
   */
  static validateFormData(data: unknown): Result<ContactFormData, ValidationError> {
    const result = this.clientFormValidationSchema.safeParse(data);
    if (!result.success) {
      const clientMessage = 'Please check your form data and try again.';
      const issueDetails = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      const internalMessage = `Form validation failed: ${issueDetails}`;
      const validationError = new ValidationError(clientMessage, internalMessage, result.error.errors);

      return Result.failure(validationError);
    }
    return Result.success(result.data);
  }

  /**
   * Validates submission data including reCAPTCHA token
   */
  static validateSubmissionData(data: unknown): Result<ContactFormSubmissionData, ValidationError> {
    const result = this.clientSubmissionSchema.safeParse(data);
    if (!result.success) {
      const clientMessage = 'Please check your form data and try again.';
      const issueDetails = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      const internalMessage = `Submission validation failed: ${issueDetails}`;
      const validationError = new ValidationError(clientMessage, internalMessage, result.error.errors);

      return Result.failure(validationError);
    }
    return Result.success(result.data);
  }

  /**
   * Validates server-side data (without reCAPTCHA)
   */
  static validateServerData(data: unknown): Result<ContactFormServerData, ValidationError> {
    const result = this.serverProcessingSchema.safeParse(data);
    if (!result.success) {
      const clientMessage = 'Please check your form data and try again.';
      const issueDetails = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      const internalMessage = `Server data validation failed: ${issueDetails}`;
      const validationError = new ValidationError(clientMessage, internalMessage, result.error.errors);

      return Result.failure(validationError);
    }
    return Result.success(result.data);
  }

  /**
   * Legacy Zod validation methods for backward compatibility
   */
  static validateFormDataLegacy(data: unknown): z.SafeParseReturnType<unknown, ContactFormData> {
    return this.clientFormValidationSchema.safeParse(data);
  }

  static validateSubmissionDataLegacy(data: unknown): z.SafeParseReturnType<unknown, ContactFormSubmissionData> {
    return this.clientSubmissionSchema.safeParse(data);
  }

  static validateServerDataLegacy(data: unknown): z.SafeParseReturnType<unknown, ContactFormServerData> {
    return this.serverProcessingSchema.safeParse(data);
  }

  /**
   * Parses form data and throws on validation error
   */
  static parseFormData(data: unknown): ContactFormData {
    return this.clientFormValidationSchema.parse(data);
  }

  /**
   * Parses submission data and throws on validation error
   */
  static parseSubmissionData(data: unknown): ContactFormSubmissionData {
    return this.clientSubmissionSchema.parse(data);
  }

  /**
   * Parses server data and throws on validation error
   */
  static parseServerData(data: unknown): ContactFormServerData {
    return this.serverProcessingSchema.parse(data);
  }
}

// Legacy exports for backward compatibility (to be removed after migration)
export const contactFormSchema = ContactFormValidator.clientFormValidationSchema;
export const contactFormSubmissionSchema = ContactFormValidator.clientSubmissionSchema;
export const contactFormServerSchema = ContactFormValidator.serverProcessingSchema;

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

const contactFormSchema = z.object({
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

export type ContactFormData = z.infer<typeof contactFormSchema>;

export class ContactFormValidator {
  static readonly schema = contactFormSchema;

  static validate(data: unknown): Result<ContactFormData, ValidationError> {
    const result = this.schema.safeParse(data);
    if (result.success) return Result.success(result.data);

    const issueDetails = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    const errorMessage = `Form validation failed: ${issueDetails}`;
    const options = { internalMessage: errorMessage, details: result.error.errors };
    const validationError = new ValidationError(errorMessage, options);

    return Result.failure(validationError);
  }

  static extractRecaptchaToken(data: unknown): string | null {
    if (typeof data !== 'object' || data === null) return null;
    const obj = data as Record<string, unknown>;
    return typeof obj.recaptchaToken === 'string' && obj.recaptchaToken.length > 0 ? obj.recaptchaToken : null;
  }

  static extractFormData(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) return data;
    const obj = data as Record<string, unknown>;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { recaptchaToken, ...formData } = obj;
    return formData;
  }
}

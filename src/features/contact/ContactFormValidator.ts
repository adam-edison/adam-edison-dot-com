import { z } from 'zod';

// Custom validator for non-whitespace content
const nonWhitespaceString = (minLength: number, maxLength: number) =>
  z
    .string()
    .min(minLength, `Must be at least ${minLength} characters`)
    .max(maxLength, `Must be at most ${maxLength} characters`)
    .refine((val) => val.trim().length >= minLength, {
      message: `Must contain at least ${minLength} non-whitespace characters`
    });

// Base schema without reCAPTCHA token
const baseContactSchema = z.object({
  firstName: z
    .string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be at most 50 characters')
    .refine((val) => {
      // Must contain at least one letter (Unicode letter category)
      return /\p{L}/u.test(val);
    }, 'First name must contain at least one letter')
    .refine((val) => {
      // Cannot be purely numbers
      return !/^\d+$/.test(val);
    }, 'First name cannot be only numbers')
    .refine((val) => {
      // Cannot be purely symbols/punctuation
      return !/^[\p{P}\p{S}]+$/u.test(val);
    }, 'First name cannot be only symbols'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .refine((val) => {
      // Must contain at least one letter (Unicode letter category)
      return /\p{L}/u.test(val);
    }, 'Last name must contain at least one letter')
    .refine((val) => {
      // Cannot be purely numbers
      return !/^\d+$/.test(val);
    }, 'Last name cannot be only numbers')
    .refine((val) => {
      // Cannot be purely symbols/punctuation
      return !/^[\p{P}\p{S}]+$/u.test(val);
    }, 'Last name cannot be only symbols'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(100, 'Email must be at most 100 characters')
    .refine((email) => {
      // Additional validation: check for common email patterns
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    }, 'Please enter a valid email address')
    .refine((email) => {
      // Prevent obvious fake emails
      const fakePatterns = ['test@test', 'example@example', 'user@user', 'admin@admin'];
      return !fakePatterns.some((pattern) => email.toLowerCase().includes(pattern));
    }, 'Please enter a valid email address')
    .refine((email) => {
      // Check for consecutive dots
      return !email.includes('..');
    }, 'Please enter a valid email address')
    .refine((email) => {
      // Check for valid TLD (at least 2 characters)
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
  // Client-side form schema (without reCAPTCHA token for form validation)
  static readonly contactFormSchema = baseContactSchema;

  // Full schema with reCAPTCHA token for API submission
  static readonly contactFormSubmissionSchema = baseContactSchema.extend({
    recaptchaToken: z.string().min(1, 'Please complete the reCAPTCHA verification')
  });

  // Server-side schema without reCAPTCHA token
  static readonly contactFormServerSchema = baseContactSchema;

  /**
   * Validates form data for client-side use (without reCAPTCHA)
   */
  static validateFormData(data: unknown): z.SafeParseReturnType<unknown, ContactFormData> {
    return this.contactFormSchema.safeParse(data);
  }

  /**
   * Validates submission data including reCAPTCHA token
   */
  static validateSubmissionData(data: unknown): z.SafeParseReturnType<unknown, ContactFormSubmissionData> {
    return this.contactFormSubmissionSchema.safeParse(data);
  }

  /**
   * Validates server-side data (without reCAPTCHA)
   */
  static validateServerData(data: unknown): z.SafeParseReturnType<unknown, ContactFormServerData> {
    return this.contactFormServerSchema.safeParse(data);
  }

  /**
   * Parses form data and throws on validation error
   */
  static parseFormData(data: unknown): ContactFormData {
    return this.contactFormSchema.parse(data);
  }

  /**
   * Parses submission data and throws on validation error
   */
  static parseSubmissionData(data: unknown): ContactFormSubmissionData {
    return this.contactFormSubmissionSchema.parse(data);
  }

  /**
   * Parses server data and throws on validation error
   */
  static parseServerData(data: unknown): ContactFormServerData {
    return this.contactFormServerSchema.parse(data);
  }
}

// Legacy exports for backward compatibility (to be removed after migration)
export const contactFormSchema = ContactFormValidator.contactFormSchema;
export const contactFormSubmissionSchema = ContactFormValidator.contactFormSubmissionSchema;
export const contactFormServerSchema = ContactFormValidator.contactFormServerSchema;

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
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, apostrophes, and hyphens'),
  lastName: z
    .string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be at most 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, apostrophes, and hyphens'),
  email: z.string().email('Please enter a valid email address').max(100, 'Email must be at most 100 characters'),
  confirmEmail: z.string().email('Please enter a valid email address').max(100, 'Email must be at most 100 characters'),
  message: nonWhitespaceString(50, 1000)
});

// Client-side form schema (without reCAPTCHA token for form validation)
export const contactFormSchema = baseContactSchema.refine((data) => data.email === data.confirmEmail, {
  message: 'Email addresses must match',
  path: ['confirmEmail']
});

// Full schema with reCAPTCHA token for API submission
export const contactFormSubmissionSchema = baseContactSchema
  .extend({
    recaptchaToken: z.string().min(1, 'Please complete the reCAPTCHA verification')
  })
  .refine((data) => data.email === data.confirmEmail, {
    message: 'Email addresses must match',
    path: ['confirmEmail']
  });

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type ContactFormSubmissionData = z.infer<typeof contactFormSubmissionSchema>;

// Server-side schema without reCAPTCHA token (but with email matching validation)
export const contactFormServerSchema = baseContactSchema.refine((data) => data.email === data.confirmEmail, {
  message: 'Email addresses must match',
  path: ['confirmEmail']
});

export type ContactFormServerData = z.infer<typeof contactFormServerSchema>;

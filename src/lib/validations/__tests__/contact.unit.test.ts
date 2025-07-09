import { describe, expect, test } from 'vitest';
import {
  contactFormSchema,
  contactFormSubmissionSchema,
  contactFormServerSchema,
  type ContactFormData,
  type ContactFormSubmissionData,
  type ContactFormServerData
} from '../contact';

describe('Contact Form Validation', () => {
  describe('firstName validation', () => {
    test('should accept valid first names', () => {
      const validNames = [
        'John',
        'Mary-Jane',
        "O'Connor",
        'José María',
        'Anne Marie',
        'François',
        'Müller',
        'Žora',
        'Aikaterini',
        'Çetin',
        'Привет',
        'مريم',
        '中文',
        'こんにちは'
      ];

      validNames.forEach((firstName) => {
        const result = contactFormSchema.safeParse({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject first names that are too short', () => {
      const result = contactFormSchema.safeParse({
        firstName: 'A',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name must be at least 2 characters');
      }
    });

    test('should reject first names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = contactFormSchema.safeParse({
        firstName: longName,
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name must be at most 50 characters');
      }
    });

    test('should reject first names that are purely numbers', () => {
      const invalidNames = ['123', '456789', '00'];

      invalidNames.forEach((firstName) => {
        const result = contactFormSchema.safeParse({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('First name must contain at least one letter');
        }
      });
    });

    test('should reject first names that are purely symbols', () => {
      const invalidNames = ['!@#', '$$$$', '***', '&&&'];

      invalidNames.forEach((firstName) => {
        const result = contactFormSchema.safeParse({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('First name must contain at least one letter');
        }
      });
    });

    test('should reject first names without any letters', () => {
      const invalidNames = ['123!@#', '999$$$', '---'];

      invalidNames.forEach((firstName) => {
        const result = contactFormSchema.safeParse({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('First name must contain at least one letter');
        }
      });
    });

    test('should accept first names with mixed letters and symbols', () => {
      const validNames = ['John123', 'Mary@Jane', 'Test$Name', 'User.Name', 'Name!'];

      validNames.forEach((firstName) => {
        const result = contactFormSchema.safeParse({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('lastName validation', () => {
    test('should accept valid last names', () => {
      const validNames = [
        'Smith',
        'Van Der Berg',
        "O'Connor",
        'García-López',
        'De La Cruz',
        'Müller',
        'Žeravčić',
        'Papadopoulos',
        'Çelik',
        'Петров',
        'الأحمد',
        '李明',
        '田中'
      ];

      validNames.forEach((lastName) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject last names that are too short', () => {
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'A',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Last name must be at least 2 characters');
      }
    });

    test('should reject last names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: longName,
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Last name must be at most 50 characters');
      }
    });

    test('should reject last names that are purely numbers', () => {
      const invalidNames = ['123', '456789', '00'];

      invalidNames.forEach((lastName) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Last name must contain at least one letter');
        }
      });
    });

    test('should reject last names that are purely symbols', () => {
      const invalidNames = ['!@#', '$$$$', '***', '&&&'];

      invalidNames.forEach((lastName) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Last name must contain at least one letter');
        }
      });
    });

    test('should reject last names without any letters', () => {
      const invalidNames = ['123!@#', '999$$$', '---'];

      invalidNames.forEach((lastName) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Last name must contain at least one letter');
        }
      });
    });

    test('should accept last names with mixed letters and symbols', () => {
      const validNames = ['Smith123', 'Doe@Domain', 'Test$Name', 'User.Name', 'Name!'];

      validNames.forEach((lastName) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(true);
      });
    });
  });

  describe('email validation', () => {
    test('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.com',
        'user123@test-domain.net'
      ];

      validEmails.forEach((email) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject empty email', () => {
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email is required');
      }
    });

    test('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user@domain',
        'user.domain.com',
        'user@@domain.com',
        'user@domain..com'
      ];

      invalidEmails.forEach((email) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.some((issue) => issue.message.includes('valid email'))).toBe(true);
        }
      });
    });

    test('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(90) + '@example.com';
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: longEmail,
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email must be at most 100 characters');
      }
    });

    test('should reject fake email patterns', () => {
      const fakeEmails = ['test@test.com', 'example@example.com', 'user@user.com', 'admin@admin.com'];

      fakeEmails.forEach((email) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please enter a valid email address');
        }
      });
    });

    test('should reject emails with consecutive dots', () => {
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'user..name@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please enter a valid email address');
      }
    });

    test('should reject emails with invalid TLD', () => {
      const invalidTLDs = ['user@domain.c', 'user@domain.', 'user@domain'];

      invalidTLDs.forEach((email) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please enter a valid email address');
        }
      });
    });
  });

  describe('message validation', () => {
    test('should accept valid messages', () => {
      const validMessages = [
        'This is a test message with more than fifty characters to meet the minimum requirement.',
        'A'.repeat(50),
        'A'.repeat(1000),
        'Message with special characters: !@#$%^&*()_+-=[]{}|;:,.<>?'
      ];

      validMessages.forEach((message) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          message
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject messages that are too short', () => {
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'Short'
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be at least 50 characters');
      }
    });

    test('should reject messages that are too long', () => {
      const longMessage = 'A'.repeat(1001);
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: longMessage
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Must be at most 1000 characters');
      }
    });

    test('should reject messages with only whitespace', () => {
      const whitespaceMessages = [' '.repeat(50), '\t'.repeat(50), '\n'.repeat(50), ' \t\n '.repeat(25)];

      whitespaceMessages.forEach((message) => {
        const result = contactFormSchema.safeParse({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          message
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Must contain at least 50 non-whitespace characters');
        }
      });
    });

    test('should accept messages with leading/trailing whitespace if content is sufficient', () => {
      const messageWithWhitespace = '   ' + 'A'.repeat(50) + '   ';
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: messageWithWhitespace
      });

      expect(result.success).toBe(true);
    });
  });

  describe('recaptchaToken validation', () => {
    test('should accept valid recaptcha token in submission schema', () => {
      const result = contactFormSubmissionSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
        recaptchaToken: 'valid-recaptcha-token'
      });

      expect(result.success).toBe(true);
    });

    test('should reject empty recaptcha token in submission schema', () => {
      const result = contactFormSubmissionSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
        recaptchaToken: ''
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Please complete the reCAPTCHA verification');
      }
    });

    test('should not require recaptcha token in form schema', () => {
      const result = contactFormSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(true);
    });

    test('should not require recaptcha token in server schema', () => {
      const result = contactFormServerSchema.safeParse({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('type exports', () => {
    test('should export correct types', () => {
      const formData: ContactFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      };

      const submissionData: ContactFormSubmissionData = {
        ...formData,
        recaptchaToken: 'token'
      };

      const serverData: ContactFormServerData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      };

      expect(formData).toBeDefined();
      expect(submissionData).toBeDefined();
      expect(serverData).toBeDefined();
    });
  });
});

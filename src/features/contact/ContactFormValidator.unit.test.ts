import { describe, expect, test } from 'vitest';
import { strict as assert } from 'node:assert';
import { ContactFormValidator, type ContactFormData } from './ContactFormValidator';

describe('ContactFormValidator', () => {
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
        const result = ContactFormValidator.validate({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject first names that are too short', () => {
      const result = ContactFormValidator.validate({
        firstName: 'A',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
        mathAnswer: '7'
      });

      assert(!result.success);
      const expectedMessage = 'First name must be at least 2 characters';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject first names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = ContactFormValidator.validate({
        firstName: longName,
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      assert(!result.success);
      const expectedMessage = 'First name must be at most 50 characters';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject first names that are purely numbers', () => {
      const invalidNames = ['123', '456789', '00'];

      invalidNames.forEach((firstName) => {
        const result = ContactFormValidator.validate({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'First name must contain at least one letter';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should reject first names that are purely symbols', () => {
      const invalidNames = ['!@#', '$$$$', '***', '&&&'];

      invalidNames.forEach((firstName) => {
        const result = ContactFormValidator.validate({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'First name must contain at least one letter';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should reject first names without any letters', () => {
      const invalidNames = ['123!@#', '999$$$', '---'];

      invalidNames.forEach((firstName) => {
        const result = ContactFormValidator.validate({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'First name must contain at least one letter';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should accept first names with mixed letters and symbols', () => {
      const validNames = ['John123', 'Mary@Jane', 'Test$Name', 'User.Name', 'Name!'];

      validNames.forEach((firstName) => {
        const result = ContactFormValidator.validate({
          firstName,
          lastName: 'Doe',
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
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
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject last names that are too short', () => {
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: 'A',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      assert(!result.success);
      const expectedMessage = 'Last name must be at least 2 characters';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject last names that are too long', () => {
      const longName = 'A'.repeat(51);
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: longName,
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      assert(!result.success);
      const expectedMessage = 'Last name must be at most 50 characters';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject last names that are purely numbers', () => {
      const invalidNames = ['123', '456789', '00'];

      invalidNames.forEach((lastName) => {
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'Last name must contain at least one letter';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should reject last names that are purely symbols', () => {
      const invalidNames = ['!@#', '$$$$', '***', '&&&'];

      invalidNames.forEach((lastName) => {
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'Last name must contain at least one letter';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should reject last names without any letters', () => {
      const invalidNames = ['123!@#', '999$$$', '---'];

      invalidNames.forEach((lastName) => {
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'Last name must contain at least one letter';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should accept last names with mixed letters and symbols', () => {
      const validNames = ['Smith123', 'Doe@Domain', 'Test$Name', 'User.Name', 'Name!'];

      validNames.forEach((lastName) => {
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName,
          email: 'test@example.com',
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
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
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject empty email', () => {
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      assert(!result.success);
      const expectedMessage = 'Email is required';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
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
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'valid email';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(90) + '@example.com';
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: 'Doe',
        email: longEmail,
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      assert(!result.success);
      const expectedMessage = 'Email must be at most 100 characters';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject fake email patterns', () => {
      const fakeEmails = ['test@test.com', 'example@example.com', 'user@user.com', 'admin@admin.com'];

      fakeEmails.forEach((email) => {
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'valid email';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should reject emails with consecutive dots', () => {
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: 'Doe',
        email: 'user..name@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });

      assert(!result.success);
      const expectedMessage = 'valid email';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject emails with invalid TLD', () => {
      const invalidTLDs = ['user@domain.c', 'user@domain.', 'user@domain'];

      invalidTLDs.forEach((email) => {
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName: 'Doe',
          email,
          message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'valid email';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
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
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          message,
          mathAnswer: '7'
        });

        expect(result.success).toBe(true);
      });
    });

    test('should reject messages that are too short', () => {
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'Short'
      });

      assert(!result.success);
      const expectedMessage = 'Must be at least 50 characters';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject messages that are too long', () => {
      const longMessage = 'A'.repeat(1001);
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: longMessage
      });

      assert(!result.success);
      const expectedMessage = 'Must be at most 1000 characters';
      expect(result.error.message).toContain(expectedMessage);
      expect(result.error.internalMessage).toContain(expectedMessage);
    });

    test('should reject messages with only whitespace', () => {
      const whitespaceMessages = [' '.repeat(50), '\t'.repeat(50), '\n'.repeat(50), ' \t\n '.repeat(25)];

      whitespaceMessages.forEach((message) => {
        const result = ContactFormValidator.validate({
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com',
          message,
          mathAnswer: '7'
        });

        assert(!result.success);
        const expectedMessage = 'Must contain at least 50 non-whitespace characters';
        expect(result.error.message).toContain(expectedMessage);
        expect(result.error.internalMessage).toContain(expectedMessage);
      });
    });

    test('should accept messages with leading/trailing whitespace if content is sufficient', () => {
      const messageWithWhitespace = '   ' + 'A'.repeat(50) + '   ';
      const result = ContactFormValidator.validate({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: messageWithWhitespace,
        mathAnswer: '7'
      });

      expect(result.success).toBe(true);
    });
  });

  describe('anti-bot data extraction', () => {
    test('should extract anti-bot data when present', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
        antiBotData: {
          subject: '',
          phone: '',
          formLoadTime: Date.now(),
          mathAnswer: '7',
          mathNum1: 3,
          mathNum2: 4
        }
      };

      const antiBotData = ContactFormValidator.extractAntiBotData(data);
      expect(antiBotData).toEqual(data.antiBotData);
    });

    test('should return null for missing anti-bot data', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      };

      const antiBotData = ContactFormValidator.extractAntiBotData(data);
      expect(antiBotData).toBeNull();
    });

    test('should extract form data without anti-bot data', () => {
      const data = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
        antiBotData: {
          subject: '',
          phone: '',
          formLoadTime: Date.now(),
          mathAnswer: '7',
          mathNum1: 3,
          mathNum2: 4
        }
      };

      const formData = ContactFormValidator.extractFormData(data);
      expect(formData).toEqual({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.'
      });
    });
  });

  describe('static methods', () => {
    test('should validate form data successfully', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
        mathAnswer: '7'
      };

      const result = ContactFormValidator.validate(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    test('should return error for invalid form data', () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'Short'
      };

      const result = ContactFormValidator.validate(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('type exports', () => {
    test('should export correct types', () => {
      const formData: ContactFormData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        message: 'This is a test message with more than fifty characters to meet the minimum requirement.',
        mathAnswer: '7'
      };

      expect(formData).toBeDefined();
    });
  });
});

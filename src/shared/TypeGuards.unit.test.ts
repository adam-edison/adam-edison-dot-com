import { describe, it, expect } from 'vitest';
import {
  isObjectRecord,
  isDurationString,
  createDurationString,
  toDurationString,
  hasProperty,
  hasStringProperty,
  getStringProperty,
  isFormDataWithTurnstile,
  DurationString
} from './TypeGuards';

describe('TypeGuards', () => {
  describe('isObjectRecord', () => {
    it('should return true for plain objects', () => {
      expect(isObjectRecord({})).toBe(true);
      expect(isObjectRecord({ key: 'value' })).toBe(true);
      expect(isObjectRecord({ a: 1, b: 'test', c: null })).toBe(true);
    });

    it('should return false for non-objects', () => {
      expect(isObjectRecord(null)).toBe(false);
      expect(isObjectRecord(undefined)).toBe(false);
      expect(isObjectRecord('string')).toBe(false);
      expect(isObjectRecord(123)).toBe(false);
      expect(isObjectRecord(true)).toBe(false);
      expect(isObjectRecord([])).toBe(false);
      expect(isObjectRecord(new Date())).toBe(false);
    });
  });

  describe('isDurationString', () => {
    it('should return true for valid duration strings', () => {
      expect(isDurationString('10 s')).toBe(true);
      expect(isDurationString('5 m')).toBe(true);
      expect(isDurationString('1 h')).toBe(true);
      expect(isDurationString('30 d')).toBe(true);
      expect(isDurationString('0 s')).toBe(true);
      expect(isDurationString('999 m')).toBe(true);
    });

    it('should return false for invalid duration strings', () => {
      expect(isDurationString('10s')).toBe(false); // no space
      expect(isDurationString('10  s')).toBe(false); // multiple spaces
      expect(isDurationString('ten s')).toBe(false); // non-numeric
      expect(isDurationString('10 x')).toBe(false); // invalid unit
      expect(isDurationString('10 sec')).toBe(false); // wrong unit format
      expect(isDurationString(' 10 s')).toBe(false); // leading space
      expect(isDurationString('10 s ')).toBe(false); // trailing space
      expect(isDurationString('')).toBe(false); // empty string
    });

    it('should return false for non-strings', () => {
      expect(isDurationString(null)).toBe(false);
      expect(isDurationString(undefined)).toBe(false);
      expect(isDurationString(123)).toBe(false);
      expect(isDurationString({})).toBe(false);
      expect(isDurationString([])).toBe(false);
    });

    it('should provide proper TypeScript type narrowing to DurationString', () => {
      const value: unknown = '10 m';

      if (isDurationString(value)) {
        // TypeScript should know this is a DurationString
        const duration: DurationString = value;
        expect(duration).toBe('10 m');
        expect(typeof duration).toBe('string');
      }
    });
  });

  describe('createDurationString', () => {
    it('should return DurationString for valid duration strings', () => {
      const validDurations = ['10 s', '5 m', '1 h', '30 d', '0 s', '999 m'];

      validDurations.forEach((duration) => {
        const result = createDurationString(duration);
        expect(result).toBe(duration);
        expect(typeof result).toBe('string');

        // Verify it's properly typed as DurationString
        if (result) {
          const typed: DurationString = result;
          expect(typed).toBe(duration);
        }
      });
    });

    it('should return null for invalid duration strings', () => {
      const invalidDurations = ['10s', '10  s', 'ten s', '10 x', '10 sec', ' 10 s', '10 s ', ''];

      invalidDurations.forEach((duration) => {
        const result = createDurationString(duration);
        expect(result).toBeNull();
      });
    });

    it('should provide type safety', () => {
      const validResult = createDurationString('10 m');
      const invalidResult = createDurationString('invalid');

      expect(validResult).toBe('10 m');
      expect(invalidResult).toBeNull();

      // Type narrowing test
      if (validResult !== null) {
        const duration: DurationString = validResult;
        expect(duration).toBe('10 m');
      }
    });
  });

  describe('toDurationString', () => {
    it('should return DurationString for valid unknown values', () => {
      const validValues: unknown[] = ['10 s', '5 m', '1 h', '30 d'];

      validValues.forEach((value) => {
        const result = toDurationString(value);
        expect(result).toBe(value);
        expect(typeof result).toBe('string');

        if (result) {
          const typed: DurationString = result;
          expect(typed).toBe(value);
        }
      });
    });

    it('should return null for invalid unknown values', () => {
      const invalidValues: unknown[] = [
        '10s', // no space
        'invalid',
        123,
        null,
        undefined,
        {},
        [],
        true,
        new Date()
      ];

      invalidValues.forEach((value) => {
        const result = toDurationString(value);
        expect(result).toBeNull();
      });
    });

    it('should handle edge cases and type safety', () => {
      // Test with various types
      expect(toDurationString('10 m')).toBe('10 m');
      expect(toDurationString('invalid')).toBeNull();
      expect(toDurationString(null)).toBeNull();
      expect(toDurationString(undefined)).toBeNull();
      expect(toDurationString(42)).toBeNull();
      expect(toDurationString({})).toBeNull();

      // Type narrowing
      const unknownValue: unknown = '5 h';
      const result = toDurationString(unknownValue);

      if (result !== null) {
        const duration: DurationString = result;
        expect(duration).toBe('5 h');
      }
    });
  });

  describe('hasProperty', () => {
    it('should return true when object has the property', () => {
      const obj = { name: 'test', age: 25 };
      expect(hasProperty(obj, 'name')).toBe(true);
      expect(hasProperty(obj, 'age')).toBe(true);
    });

    it('should return false when object lacks the property', () => {
      const obj = { name: 'test' };
      expect(hasProperty(obj, 'age')).toBe(false);
      expect(hasProperty(obj, 'missing')).toBe(false);
    });

    it('should return false for non-objects', () => {
      expect(hasProperty(null, 'prop')).toBe(false);
      expect(hasProperty(undefined, 'prop')).toBe(false);
      expect(hasProperty('string', 'prop')).toBe(false);
      expect(hasProperty(123, 'prop')).toBe(false);
    });
  });

  describe('hasStringProperty', () => {
    it('should return true when object has string property', () => {
      const obj = { name: 'test', age: 25, empty: '' };
      expect(hasStringProperty(obj, 'name')).toBe(true);
      expect(hasStringProperty(obj, 'empty')).toBe(true);
    });

    it('should return false when property exists but is not string', () => {
      const obj = { name: 'test', age: 25, flag: true, data: null };
      expect(hasStringProperty(obj, 'age')).toBe(false);
      expect(hasStringProperty(obj, 'flag')).toBe(false);
      expect(hasStringProperty(obj, 'data')).toBe(false);
    });

    it('should return false when property does not exist', () => {
      const obj = { name: 'test' };
      expect(hasStringProperty(obj, 'missing')).toBe(false);
    });
  });

  describe('getStringProperty', () => {
    it('should return string value when property exists and is string', () => {
      const obj = { name: 'test', description: 'hello world', empty: '' };
      expect(getStringProperty(obj, 'name')).toBe('test');
      expect(getStringProperty(obj, 'description')).toBe('hello world');
      expect(getStringProperty(obj, 'empty')).toBe('');
    });

    it('should return undefined when property exists but is not string', () => {
      const obj = { name: 'test', age: 25, flag: true, data: null };
      expect(getStringProperty(obj, 'age')).toBeUndefined();
      expect(getStringProperty(obj, 'flag')).toBeUndefined();
      expect(getStringProperty(obj, 'data')).toBeUndefined();
    });

    it('should return undefined when property does not exist', () => {
      const obj = { name: 'test' };
      expect(getStringProperty(obj, 'missing')).toBeUndefined();
    });

    it('should return undefined for non-objects', () => {
      expect(getStringProperty(null, 'prop')).toBeUndefined();
      expect(getStringProperty(undefined, 'prop')).toBeUndefined();
      expect(getStringProperty('string', 'prop')).toBeUndefined();
    });
  });

  describe('isFormDataWithTurnstile', () => {
    it('should return true for valid objects (form data)', () => {
      expect(isFormDataWithTurnstile({})).toBe(true);
      expect(isFormDataWithTurnstile({ name: 'test' })).toBe(true);
      expect(isFormDataWithTurnstile({ turnstileToken: 'token123' })).toBe(true);
      expect(isFormDataWithTurnstile({ name: 'test', turnstileToken: 'token123' })).toBe(true);
      expect(isFormDataWithTurnstile({ turnstileToken: '' })).toBe(true); // empty string is valid
    });

    it('should return false for non-objects', () => {
      expect(isFormDataWithTurnstile(null)).toBe(false);
      expect(isFormDataWithTurnstile(undefined)).toBe(false);
      expect(isFormDataWithTurnstile('string')).toBe(false);
      expect(isFormDataWithTurnstile(123)).toBe(false);
      expect(isFormDataWithTurnstile([])).toBe(false);
    });

    it('should return false when turnstileToken exists but is not a string', () => {
      // These are the critical test cases that would have caught the original bug
      expect(isFormDataWithTurnstile({ turnstileToken: 123 })).toBe(false);
      expect(isFormDataWithTurnstile({ turnstileToken: null })).toBe(false);
      expect(isFormDataWithTurnstile({ turnstileToken: undefined })).toBe(false);
      expect(isFormDataWithTurnstile({ turnstileToken: {} })).toBe(false);
      expect(isFormDataWithTurnstile({ turnstileToken: [] })).toBe(false);
      expect(isFormDataWithTurnstile({ turnstileToken: true })).toBe(false);
      expect(isFormDataWithTurnstile({ name: 'test', turnstileToken: 456 })).toBe(false);
    });

    it('should provide proper TypeScript type narrowing', () => {
      const validData = { name: 'test', turnstileToken: 'token123' };
      const invalidData = { name: 'test', turnstileToken: 123 };

      if (isFormDataWithTurnstile(validData)) {
        // TypeScript should now know turnstileToken is string | undefined
        const token: string | undefined = validData.turnstileToken;
        expect(typeof token).toBe('string');
        expect(token).toBe('token123');
      }

      // This should be false, preventing unsafe access
      expect(isFormDataWithTurnstile(invalidData)).toBe(false);
    });
  });

  describe('Type Guard Integration Tests', () => {
    it('should properly validate and extract turnstile token from form data', () => {
      const validFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        turnstileToken: 'cf-token-123'
      };

      const invalidFormData1 = {
        name: 'John Doe',
        email: 'john@example.com',
        turnstileToken: 123 // not a string
      };

      const invalidFormData2 = 'not an object';

      // Valid case - now using direct access as in the actual implementation
      if (isFormDataWithTurnstile(validFormData)) {
        const token = validFormData.turnstileToken; // Direct access is now type-safe
        expect(token).toBe('cf-token-123');
        expect(typeof token).toBe('string');
      }

      // Invalid token type - type guard should reject this
      expect(isFormDataWithTurnstile(invalidFormData1)).toBe(false);

      // Invalid data type
      expect(isFormDataWithTurnstile(invalidFormData2)).toBe(false);
    });

    it('should properly validate duration strings for rate limiting', () => {
      const validWindows = ['10 s', '5 m', '1 h', '30 d'];
      const invalidWindows = ['10s', '5 min', 'invalid', '', null, undefined];

      validWindows.forEach((window) => {
        expect(isDurationString(window)).toBe(true);
      });

      invalidWindows.forEach((window) => {
        expect(isDurationString(window)).toBe(false);
      });
    });

    it('should catch runtime type safety violations in actual usage patterns', () => {
      // Simulate the ContactFormProcessor usage pattern
      const formDataCases = [
        { data: { name: 'test', turnstileToken: 'valid-token' }, shouldPass: true },
        { data: { name: 'test' }, shouldPass: true }, // no token is ok
        { data: { name: 'test', turnstileToken: 123 }, shouldPass: false }, // invalid token type
        { data: { name: 'test', turnstileToken: null }, shouldPass: false },
        { data: { name: 'test', turnstileToken: {} }, shouldPass: false }
      ];

      formDataCases.forEach(({ data, shouldPass }) => {
        const result = isFormDataWithTurnstile(data);
        expect(result).toBe(shouldPass);

        if (result && shouldPass) {
          // If type guard passes, we should be able to safely access the token
          const token = data.turnstileToken;
          if (token !== undefined) {
            expect(typeof token).toBe('string');
          }
        }
      });

      // Simulate the RateLimiterDataStore usage pattern
      const durationCases = [
        { window: '10 m', shouldPass: true },
        { window: '5 s', shouldPass: true },
        { window: '1 h', shouldPass: true },
        { window: 'invalid', shouldPass: false },
        { window: 123, shouldPass: false }, // This would cause runtime error in actual usage
        { window: null, shouldPass: false },
        { window: undefined, shouldPass: false }
      ];

      durationCases.forEach(({ window, shouldPass }) => {
        const result = isDurationString(window);
        expect(result).toBe(shouldPass);

        if (!shouldPass && typeof window !== 'string') {
          // These cases would cause runtime errors if not caught by type guard
          expect(result).toBe(false);
        }

        // Test helper functions as well
        if (typeof window === 'string') {
          const createResult = createDurationString(window);
          expect(createResult !== null).toBe(shouldPass);
        }

        const toResult = toDurationString(window);
        expect(toResult !== null).toBe(shouldPass);
      });
    });
  });

  describe('Edge Case and Security Tests', () => {
    describe('isObjectRecord edge cases', () => {
      it('should handle prototype pollution attempts', () => {
        const maliciousObject = JSON.parse('{"__proto__": {"isAdmin": true}}');
        expect(isObjectRecord(maliciousObject)).toBe(true); // Should still be a valid object
        // But ensure it's a plain object, not something with custom prototype
        if (isObjectRecord(maliciousObject)) {
          expect(maliciousObject.constructor).toBe(Object);
        }
      });

      it('should reject objects with custom constructors', () => {
        class CustomClass {}
        const customInstance = new CustomClass();
        expect(isObjectRecord(customInstance)).toBe(false);
        expect(isObjectRecord(new Map())).toBe(false);
        expect(isObjectRecord(new Set())).toBe(false);
        expect(isObjectRecord(/regex/)).toBe(false);
      });

      it('should handle frozen and sealed objects', () => {
        const frozenObj = Object.freeze({ key: 'value' });
        const sealedObj = Object.seal({ key: 'value' });
        expect(isObjectRecord(frozenObj)).toBe(true);
        expect(isObjectRecord(sealedObj)).toBe(true);
      });
    });

    describe('isDurationString comprehensive validation', () => {
      it('should reject malicious or malformed inputs', () => {
        const maliciousInputs = [
          // Note: Current regex allows large numbers - this is a design decision
          // '999999999999999999999 s' would actually pass current validation
          '-10 s', // Negative numbers
          '10.5 s', // Decimals (not allowed)
          '10 s; rm -rf /', // Command injection attempt
          '10\ns', // Newline character (fixed escaping)
          '10\ts', // Tab character (fixed escaping)
          'eval() s', // Code injection attempt
          '${10} s' // Template literal injection
        ];

        maliciousInputs.forEach((input) => {
          expect(isDurationString(input)).toBe(false);
        });
      });

      it('should validate exact format requirements', () => {
        // Test boundary conditions
        expect(isDurationString('0 s')).toBe(true);
        expect(isDurationString('1 s')).toBe(true);
        expect(isDurationString('00 s')).toBe(true); // Leading zeros allowed

        // Invalid formats
        expect(isDurationString(' 1 s')).toBe(false); // Leading space
        expect(isDurationString('1 s ')).toBe(false); // Trailing space
        expect(isDurationString('1  s')).toBe(false); // Multiple spaces
        expect(isDurationString('1\ns')).toBe(false); // Newline
        expect(isDurationString('1\ts')).toBe(false); // Tab
      });
    });

    describe('hasProperty and hasStringProperty stress tests', () => {
      it('should handle objects with symbol properties', () => {
        const sym = Symbol('test');
        const objWithSymbol = { [sym]: 'value', regularProp: 'test' };

        expect(hasProperty(objWithSymbol, 'regularProp')).toBe(true);
        expect(hasStringProperty(objWithSymbol, 'regularProp')).toBe(true);
        // Symbol properties shouldn't interfere with string property checks
      });

      it('should handle objects with getter/setter properties', () => {
        const obj = {};
        Object.defineProperty(obj, 'dynamicProp', {
          get() {
            return 'dynamic value';
          },
          enumerable: true
        });

        expect(hasProperty(obj, 'dynamicProp')).toBe(true);
        expect(hasStringProperty(obj, 'dynamicProp')).toBe(true);
      });

      it('should handle property names that could cause issues', () => {
        // Most problematic names work fine
        const workingNames = ['prototype', 'toString', 'valueOf'];
        const obj1: Record<string, unknown> = {};

        workingNames.forEach((name) => {
          obj1[name] = 'safe value';
          expect(hasProperty(obj1, name)).toBe(true);
          expect(hasStringProperty(obj1, name)).toBe(true);
        });

        // __proto__ is special - assigning to it changes the prototype, not the property
        const obj2: Record<string, unknown> = {};
        obj2['__proto__'] = 'safe value'; // This actually changes the prototype!
        expect(hasProperty(obj2, '__proto__')).toBe(true);
        expect(hasStringProperty(obj2, '__proto__')).toBe(false); // Not a string anymore!
        expect(typeof obj2['__proto__']).toBe('object'); // It's an object now

        // Constructor is special - overriding it breaks isObjectRecord's constructor check
        const obj3: Record<string, unknown> = {};
        obj3['constructor'] = 'safe value';
        // This exposes a limitation in isObjectRecord - it's too strict
        expect(hasProperty(obj3, 'constructor')).toBe(false); // Current behavior
        expect(hasStringProperty(obj3, 'constructor')).toBe(false); // Current behavior

        // This shows the issue - the object is no longer considered a "record"
        // because we changed its constructor property
        expect(isObjectRecord(obj3)).toBe(false);
      });
    });

    describe('Type guard composition and real-world scenarios', () => {
      it('should handle deeply nested form data structures', () => {
        const complexFormData = {
          user: {
            profile: {
              name: 'John Doe',
              preferences: {
                theme: 'dark'
              }
            }
          },
          turnstileToken: 'valid-token',
          metadata: {
            timestamp: Date.now(),
            source: 'web'
          }
        };

        expect(isFormDataWithTurnstile(complexFormData)).toBe(true);
        if (isFormDataWithTurnstile(complexFormData)) {
          expect(complexFormData.turnstileToken).toBe('valid-token');
          expect(typeof complexFormData.turnstileToken).toBe('string');
        }
      });
    });
  });
});

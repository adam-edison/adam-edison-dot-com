import { describe, it, expect } from 'vitest';
import {
  isObjectRecord,
  isDurationString,
  hasProperty,
  hasStringProperty,
  getStringProperty,
  isFormDataWithTurnstile
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
    });

    it('should return false for non-objects', () => {
      expect(isFormDataWithTurnstile(null)).toBe(false);
      expect(isFormDataWithTurnstile(undefined)).toBe(false);
      expect(isFormDataWithTurnstile('string')).toBe(false);
      expect(isFormDataWithTurnstile(123)).toBe(false);
      expect(isFormDataWithTurnstile([])).toBe(false);
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

      // Valid case
      if (isFormDataWithTurnstile(validFormData)) {
        const token = getStringProperty(validFormData, 'turnstileToken');
        expect(token).toBe('cf-token-123');
      }

      // Invalid token type
      if (isFormDataWithTurnstile(invalidFormData1)) {
        const token = getStringProperty(invalidFormData1, 'turnstileToken');
        expect(token).toBeUndefined(); // Should be undefined because token is not a string
      }

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
  });
});

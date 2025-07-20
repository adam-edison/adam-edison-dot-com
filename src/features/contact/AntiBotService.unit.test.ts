import { describe, it, expect, beforeEach } from 'vitest';
import { AntiBotService, type AntiBotData } from './AntiBotService';

describe('AntiBotService', () => {
  let antiBotService: AntiBotService;

  beforeEach(() => {
    antiBotService = AntiBotService.create();
  });

  describe('generateMathChallenge', () => {
    it('should generate a math challenge with single digit numbers', () => {
      const challenge = antiBotService.generateMathChallenge();

      expect(challenge.num1).toBeGreaterThanOrEqual(1);
      expect(challenge.num1).toBeLessThanOrEqual(9);
      expect(challenge.num2).toBeGreaterThanOrEqual(1);
      expect(challenge.num2).toBeLessThanOrEqual(9);
      expect(challenge.question).toBe(`What is ${challenge.num1} + ${challenge.num2}?`);
      expect(challenge.correctAnswer).toBe(challenge.num1 + challenge.num2);
    });

    it('should generate different challenges on subsequent calls', () => {
      const challenge1 = antiBotService.generateMathChallenge();
      const challenge2 = antiBotService.generateMathChallenge();

      // Should be different at least sometimes (not a guarantee with random, but very likely)
      const isDifferent = challenge1.num1 !== challenge2.num1 || challenge1.num2 !== challenge2.num2;

      // Run multiple times to ensure randomness (very low chance of false negative)
      let foundDifference = isDifferent;
      for (let i = 0; i < 10 && !foundDifference; i++) {
        const newChallenge = antiBotService.generateMathChallenge();
        foundDifference = challenge1.num1 !== newChallenge.num1 || challenge1.num2 !== newChallenge.num2;
      }

      expect(foundDifference).toBe(true);
    });
  });

  describe('validateAntiBotData', () => {
    const validData: AntiBotData = {
      subject: '',
      phone: '',
      formLoadTime: Date.now() - 5000, // 5 seconds ago
      mathAnswer: '7',
      mathNum1: 3,
      mathNum2: 4
    };

    it('should pass validation for legitimate human submission', () => {
      const result = antiBotService.validateAntiBotData(validData);

      expect(result.success).toBe(true);
    });

    it('should fail validation when subject is filled', () => {
      const data = { ...validData, subject: 'bot-filled' };

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Backup field detected');
    });

    it('should fail validation when phone is filled', () => {
      const data = { ...validData, phone: 'spam-value' };

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Backup field detected');
    });

    it('should fail validation when form submitted too quickly', () => {
      const data = { ...validData, formLoadTime: Date.now() - 1000 }; // 1 second ago

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Form submitted too quickly');
    });

    it('should fail validation when math answer is incorrect', () => {
      const data = { ...validData, mathAnswer: '999' };

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Incorrect math answer');
    });

    it('should fail validation when math answer is empty', () => {
      const data = { ...validData, mathAnswer: '' };

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Incorrect math answer');
    });

    it('should fail validation when math answer is not a number', () => {
      const data = { ...validData, mathAnswer: 'abc' };

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Incorrect math answer');
    });

    it('should handle edge case of minimum time threshold', () => {
      const data = { ...validData, formLoadTime: Date.now() - 3000 }; // Exactly 3 seconds

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(true);
    });

    it('should handle very old form load times', () => {
      const data = { ...validData, formLoadTime: Date.now() - 3600000 }; // 1 hour ago

      const result = antiBotService.validateAntiBotData(data);

      expect(result.success).toBe(true);
    });
  });

  describe('createFormInitialData', () => {
    it('should create initial form data with current timestamp and math challenge', () => {
      const before = Date.now();
      const initialData = antiBotService.createFormInitialData();
      const after = Date.now();

      expect(initialData.subject).toBe('');
      expect(initialData.phone).toBe('');
      expect(initialData.formLoadTime).toBeGreaterThanOrEqual(before);
      expect(initialData.formLoadTime).toBeLessThanOrEqual(after);
      expect(initialData.mathAnswer).toBe('');
      expect(initialData.mathNum1).toBeGreaterThanOrEqual(1);
      expect(initialData.mathNum1).toBeLessThanOrEqual(9);
      expect(initialData.mathNum2).toBeGreaterThanOrEqual(1);
      expect(initialData.mathNum2).toBeLessThanOrEqual(9);
    });
  });
});

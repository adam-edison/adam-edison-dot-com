export interface MathChallenge {
  num1: number;
  num2: number;
  question: string;
  correctAnswer: number;
}

export interface AntiBotData {
  subject: string;
  phone: string;
  formLoadTime: number;
  mathAnswer: string;
  mathNum1: number;
  mathNum2: number;
}

import { Result } from '@/shared/Result';
import { ValidationError } from '@/shared/errors';

export class AntiBotService {
  private static readonly MIN_FORM_TIME_MS = 3000; // 3 seconds minimum

  static create(): AntiBotService {
    return new AntiBotService();
  }

  generateMathChallenge(): MathChallenge {
    // Generate single digit numbers (1-9)
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 9) + 1;

    return {
      num1,
      num2,
      question: `What is ${num1} + ${num2}?`,
      correctAnswer: num1 + num2
    };
  }

  validateAntiBotData(data: AntiBotData): Result<void, ValidationError> {
    // Check backup fields - bots tend to fill all fields
    if (data.subject.trim() !== '' || data.phone.trim() !== '') {
      const error = new ValidationError('Backup field detected', {
        internalMessage: 'Honeypot fields were filled'
      });
      return Result.failure(error);
    }

    // Check if form was submitted too quickly (likely bot behavior)
    const timeElapsed = Date.now() - data.formLoadTime;
    if (timeElapsed < AntiBotService.MIN_FORM_TIME_MS) {
      const error = new ValidationError('Form submitted too quickly', {
        internalMessage: `Form submitted in ${timeElapsed}ms, minimum is ${AntiBotService.MIN_FORM_TIME_MS}ms`
      });
      return Result.failure(error);
    }

    // Validate math answer
    const expectedAnswer = data.mathNum1 + data.mathNum2;
    const providedAnswer = parseInt(data.mathAnswer.trim());

    if (isNaN(providedAnswer) || providedAnswer !== expectedAnswer) {
      const error = new ValidationError('Incorrect math answer', {
        internalMessage: `Expected ${expectedAnswer}, got ${data.mathAnswer}`
      });
      return Result.failure(error);
    }

    return Result.success();
  }

  createFormInitialData(): AntiBotData {
    const mathChallenge = this.generateMathChallenge();

    return {
      subject: '',
      phone: '',
      formLoadTime: Date.now(),
      mathAnswer: '',
      mathNum1: mathChallenge.num1,
      mathNum2: mathChallenge.num2
    };
  }
}

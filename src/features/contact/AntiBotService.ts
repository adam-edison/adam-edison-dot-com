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

export interface AntiBotValidationResult {
  isValid: boolean;
  reason?: string;
}

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

  validateAntiBotData(data: AntiBotData): AntiBotValidationResult {
    // Check backup fields - bots tend to fill all fields
    if (data.subject.trim() !== '' || data.phone.trim() !== '') {
      return {
        isValid: false,
        reason: 'Backup field detected'
      };
    }

    // Check if form was submitted too quickly (likely bot behavior)
    const timeElapsed = Date.now() - data.formLoadTime;
    if (timeElapsed < AntiBotService.MIN_FORM_TIME_MS) {
      return {
        isValid: false,
        reason: 'Form submitted too quickly'
      };
    }

    // Validate math answer
    const expectedAnswer = data.mathNum1 + data.mathNum2;
    const providedAnswer = parseInt(data.mathAnswer.trim());

    if (isNaN(providedAnswer) || providedAnswer !== expectedAnswer) {
      return {
        isValid: false,
        reason: 'Incorrect math answer'
      };
    }

    return {
      isValid: true
    };
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

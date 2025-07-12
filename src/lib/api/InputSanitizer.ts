import validator from 'validator';

export class InputSanitizer {
  static sanitize(input: string): string {
    return validator.escape(input.trim());
  }
}

export const inputSanitizer = InputSanitizer;
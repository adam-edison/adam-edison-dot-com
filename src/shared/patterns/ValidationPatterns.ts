/**
 * Regex patterns for validation operations.
 * Contains patterns for form validation and input checking.
 */
export class ValidationPatterns {
  /**
   * Matches any Unicode letter character (includes international characters)
   * Used to verify that text fields contain at least one letter
   */
  static readonly UNICODE_LETTER = /\p{L}/u;

  /**
   * Matches strings that contain only digits (0-9)
   * Used to reject purely numeric input in name fields
   */
  static readonly ONLY_DIGITS = /^\d+$/;

  /**
   * Matches strings that contain only Unicode punctuation and symbol characters
   * Used to reject input that is purely symbols/punctuation
   */
  static readonly ONLY_SYMBOLS = /^[\p{P}\p{S}]+$/u;

  /**
   * Standard email format validation pattern
   * Matches: username@domain.tld format with common allowed characters
   */
  static readonly EMAIL_FORMAT = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  /**
   * Matches consecutive dots (..)
   * Used to detect invalid email formats with double periods
   */
  static readonly CONSECUTIVE_DOTS = /\.\./;
}

/**
 * Collection of type guard utilities for runtime type checking
 * These replace unsafe type assertions with proper validation
 */

/**
 * Branded type for duration strings to prevent mixing with regular strings
 * Format: "number unit" where unit is one of: s, m, h, d
 * Examples: "10 s", "5 m", "1 h", "30 d"
 */
export type DurationString = string & { readonly __brand: unique symbol };

/**
 * Type guard to check if a value is an object record
 * Replaces: value as Record<string, unknown>
 */
export function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && value.constructor === Object;
}

/**
 * Type guard to check if a value is a valid duration string
 * Validates format like "10 m", "1 h", "30 s"
 * Returns a branded DurationString type for type safety
 */
export function isDurationString(value: unknown): value is DurationString {
  if (typeof value !== 'string') {
    return false;
  }

  // Check if it matches pattern: number + single space + unit (s|m|h|d)
  const durationPattern = /^\d+ [smhd]$/;
  return durationPattern.test(value);
}

/**
 * Helper function to create a DurationString from a string
 * Returns null if the string is not a valid duration format
 */
export function createDurationString(value: string): DurationString | null {
  return isDurationString(value) ? value : null;
}

/**
 * Helper function to safely convert unknown values to DurationString
 * Returns null if the value is not a valid duration string
 */
export function toDurationString(value: unknown): DurationString | null {
  return isDurationString(value) ? value : null;
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<K extends string>(obj: unknown, prop: K): obj is Record<K, unknown> {
  return isObjectRecord(obj) && prop in obj;
}

/**
 * Type guard to check if an object has a string property
 */
export function hasStringProperty<K extends string>(obj: unknown, prop: K): obj is Record<K, string> {
  return hasProperty(obj, prop) && typeof obj[prop] === 'string';
}

/**
 * Safely extract a string property from an unknown object
 * Returns undefined if the property doesn't exist or isn't a string
 */
export function getStringProperty(obj: unknown, prop: string): string | undefined {
  if (hasStringProperty(obj, prop)) {
    return obj[prop];
  }
  return undefined;
}

/**
 * Type guard for form data that contains a turnstile token
 */
export function isFormDataWithTurnstile(data: unknown): data is Record<string, unknown> & {
  turnstileToken?: string;
} {
  if (!isObjectRecord(data)) return false;

  // If turnstileToken exists, it must be a string
  if ('turnstileToken' in data) {
    return typeof data.turnstileToken === 'string';
  }

  return true; // turnstileToken is optional
}

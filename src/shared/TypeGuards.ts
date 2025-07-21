/**
 * Collection of type guard utilities for runtime type checking
 * These replace unsafe type assertions with proper validation
 */

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
 */
export function isDurationString(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  // Check if it matches pattern: number + single space + unit (s|m|h|d)
  const durationPattern = /^\d+ [smhd]$/;
  return durationPattern.test(value);
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
  return isObjectRecord(data);
}

/**
 * Test utility functions for generating unique test data
 */

/**
 * Generates a unique IP address for testing purposes.
 * Uses the 10.x.x.x range (private network) with timestamp and random components
 * to ensure uniqueness across test runs and avoid rate limiting interference.
 *
 * @returns A unique IP address string in the format "10.x.x.x"
 */
export function generateUniqueIP(): string {
  const timestamp = Date.now() % 255;
  const random1 = Math.floor(Math.random() * 255);
  const random2 = Math.floor(Math.random() * 255);

  return `10.${timestamp}.${random1}.${random2}`;
}

/**
 * Generates a unique identifier for test isolation.
 * Combines timestamp and random number for uniqueness.
 *
 * @param prefix Required prefix for the identifier (should include test prefix for isolation)
 * @returns A unique identifier string
 */
export function generateUniqueIdentifier(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${timestamp}-${random}`;
}

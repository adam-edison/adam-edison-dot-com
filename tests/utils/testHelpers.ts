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

/**
 * Expects an async function to throw an error containing all specified error messages.
 * Fails the test if no error is thrown or if any expected message is missing.
 *
 * @param asyncFn The async function that should throw an error
 * @param expectedMessages Array of error message strings that should be present in the error
 * @throws Test failure if no error is thrown or expected messages are missing
 */
export async function expectErrorContaining(
  asyncFn: () => Promise<unknown>,
  expectedMessages: string[]
): Promise<void> {
  let error: unknown;

  try {
    await asyncFn();
  } catch (thrownError) {
    error = thrownError;
  }

  if (!error) {
    throw new Error('Expected function to throw an error, but it did not');
  }

  if (!(error instanceof Error)) {
    throw new Error('Expected error to be an instance of Error');
  }

  for (const expectedMessage of expectedMessages) {
    if (!error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to contain "${expectedMessage}", but got: "${error.message}"`);
    }
  }
}

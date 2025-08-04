/**
 * A utility to help mitigate timing attacks on API endpoints.
 * It ensures that a request takes at least a minimum amount of time,
 * with a small random delay added to further obscure the exact processing time.
 */
export class ResponseTimeProtector {
  private readonly startTime: number;
  private readonly minRequestTimeMs: number;
  private readonly randomDelayMaxMs: number;

  /**
   * @param minRequestTimeMs The minimum time the request should take in milliseconds. Defaults to 500ms.
   * @param randomDelayMaxMs The maximum random delay to add in milliseconds. Defaults to 100ms.
   */
  constructor(minRequestTimeMs = 500, randomDelayMaxMs = 100) {
    this.startTime = Date.now();
    this.minRequestTimeMs = minRequestTimeMs;
    this.randomDelayMaxMs = randomDelayMaxMs;
  }

  /**
   * Calculates the elapsed time since the constructor was called and waits
   * for any remaining time needed to meet the minimum request time, plus a
   * small random delay. This ensures the random delay is always added.
   */
  public async endAndProtect(): Promise<void> {
    const elapsedTime = Date.now() - this.startTime;
    const randomDelay = Math.floor(Math.random() * this.randomDelayMaxMs);

    const padding = Math.max(0, this.minRequestTimeMs - elapsedTime);
    const timeToWait = padding + randomDelay;

    if (timeToWait > 0) {
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }
  }
}

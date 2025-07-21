import type { NextApiResponse } from 'next';
import { ResponseTimeProtector } from './ResponseTimeProtector';

interface SuccessHandlerOptions {
  statusCode: number;
  data: Record<string, unknown>;
  timeProtector: ResponseTimeProtector;
}

export class ApiSuccessHandler {
  /**
   * Handles a successful API response by waiting for the response time protector
   * and then sending the JSON response.
   *
   * @param res The NextApiResponse object.
   * @param options The options for the success handler.
   */
  static async handle(res: NextApiResponse, options: SuccessHandlerOptions): Promise<void> {
    const { statusCode, data, timeProtector } = options;
    await timeProtector.endAndProtect();
    res.status(statusCode).json(data);
  }
}

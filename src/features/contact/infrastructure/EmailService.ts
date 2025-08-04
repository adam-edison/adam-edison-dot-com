import { Result } from '@/shared/Result';
import { ContactFormData } from '../ContactFormValidator';
import { SecurityTokens } from '../types';

export class EmailService {
  constructor(private baseUrl: string = '') {}

  async send(formData: ContactFormData, tokens: SecurityTokens): Promise<Result<void, string>> {
    try {
      const payload = {
        ...formData,
        csrfToken: tokens.csrfToken,
        turnstileToken: tokens.turnstileToken
      };

      const response = await fetch(`${this.baseUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return Result.success();
      }

      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.message || `Request failed with status ${response.status}`;

      return Result.failure(errorMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';

      return Result.failure(errorMessage);
    }
  }
}

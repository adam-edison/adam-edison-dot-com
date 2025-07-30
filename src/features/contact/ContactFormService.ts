import { ContactFormData } from './ContactFormValidator';

export interface ServiceStatus {
  status: 'healthy' | 'error';
  services: {
    email: { enabled: boolean; ready: boolean };
    turnstile: { enabled: boolean; ready: boolean; siteKey?: string };
  };
}

export interface SubmissionResult {
  success: boolean;
  message: string;
}

export class ContactFormService {
  async checkServerConfig(): Promise<ServiceStatus> {
    const response = await fetch('/api/email-service-check');

    if (!response.ok) {
      throw new Error('Failed to check server configuration');
    }

    return response.json();
  }

  async getCsrfToken(): Promise<string> {
    const response = await fetch('/api/csrf-token');

    if (!response.ok) {
      throw new Error('Failed to get CSRF token');
    }

    const data = await response.json();
    return data.token;
  }

  async submitForm(data: ContactFormData, turnstileToken: string | null, csrfToken: string): Promise<SubmissionResult> {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        ...data,
        turnstileToken
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Failed to send message'
      };
    }

    return {
      success: true,
      message: result.message || 'Message sent successfully'
    };
  }
}

export const defaultContactFormService = new ContactFormService();

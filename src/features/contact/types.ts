export interface SecurityTokens {
  csrfToken: string;
  turnstileToken?: string;
}

export interface ServiceConfig {
  status: 'healthy' | 'degraded';
  services: {
    email: {
      enabled: boolean;
      ready: boolean;
    };
    turnstile: {
      enabled: boolean;
      ready: boolean;
      siteKey?: string;
    };
  };
}

export interface ContactFormState {
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
  isConfigLoading: boolean;
  serviceConfig: ServiceConfig | null;
}

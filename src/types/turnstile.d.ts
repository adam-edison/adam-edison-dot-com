declare global {
  interface Window {
    turnstile: {
      render: (
        element: string | HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
          retry?: 'auto' | 'never';
          'refresh-timeout'?: 'auto' | 'manual';
          execution?: 'render' | 'execute';
          callback?: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | null;
      execute: (widgetId: string) => void;
      ready: (callback: () => void) => void;
    };
  }
}

export interface TurnstileInstance {
  widgetId: string;
  reset: () => void;
  remove: () => void;
  getResponse: () => string | null;
  execute: () => void;
}

export {};

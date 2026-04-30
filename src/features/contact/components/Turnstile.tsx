import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';

export interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  onTimeout?: () => void;
}

export interface TurnstileHandle {
  reset: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: (error: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
          size?: 'normal' | 'compact' | 'flexible';
          theme?: 'light' | 'dark' | 'auto';
          'retry-interval'?: number;
          'refresh-expired'?: 'auto' | 'manual' | 'never';
          'response-field'?: boolean;
          action?: string;
          cData?: string;
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const SCRIPT_POLL_INTERVAL_MS = 200;
const SCRIPT_POLL_MAX_RETRIES = 25;
const TURNSTILE_RETRY_INTERVAL_MS = 8000;

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(function Turnstile(
  { siteKey, onSuccess, onError, onExpire, onTimeout },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const callbacksRef = useRef({ onSuccess, onError, onExpire, onTimeout });

  useImperativeHandle(
    ref,
    () => ({
      reset() {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
    }),
    []
  );

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onExpire, onTimeout };
  }, [onSuccess, onError, onExpire, onTimeout]);

  const stableOnSuccess = useCallback((token: string) => {
    callbacksRef.current.onSuccess(token);
  }, []);

  const stableOnError = useCallback((error: string) => {
    callbacksRef.current.onError?.(error);
  }, []);

  const stableOnExpire = useCallback(() => {
    callbacksRef.current.onExpire?.();
  }, []);

  const stableOnTimeout = useCallback(() => {
    callbacksRef.current.onTimeout?.();
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const cleanupExistingWidget = () => {
      if (!widgetIdRef.current || !window.turnstile) return;

      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore errors during cleanup
      }
      widgetIdRef.current = null;
    };

    const renderWidget = () => {
      if (!window.turnstile || !containerRef.current) return;

      cleanupExistingWidget();

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: stableOnSuccess,
          'error-callback': stableOnError,
          'expired-callback': stableOnExpire,
          'timeout-callback': stableOnTimeout,
          size: 'flexible',
          theme: 'auto',
          'retry-interval': TURNSTILE_RETRY_INTERVAL_MS,
          'refresh-expired': 'auto',
          'response-field': true
        });
      } catch {
        stableOnError('Failed to render Turnstile widget');
      }
    };

    if (window.turnstile) {
      renderWidget();
      return () => {
        cleanupExistingWidget();
      };
    }

    let retryCount = 0;
    const checkInterval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(checkInterval);
        renderWidget();
        return;
      }

      retryCount++;
      if (retryCount >= SCRIPT_POLL_MAX_RETRIES) {
        clearInterval(checkInterval);
        stableOnError('Turnstile script failed to load within timeout period');
      }
    }, SCRIPT_POLL_INTERVAL_MS);

    return () => {
      clearInterval(checkInterval);
      cleanupExistingWidget();
    };
  }, [siteKey, stableOnSuccess, stableOnError, stableOnExpire, stableOnTimeout]);

  return (
    <div style={{ maxWidth: '500px' }}>
      <div ref={containerRef} style={{ minHeight: '65px', width: '100%' }} data-testid="turnstile-container" />
    </div>
  );
});

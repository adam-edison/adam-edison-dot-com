import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

export interface TurnstileProps {
  siteKey: string;
  onSuccess: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
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
  { siteKey, onSuccess, onError, onExpire },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Decouple the render effect from callback identity. The render effect's dep array is [siteKey] only — closing
  // over onSuccess/onError/onExpire directly would re-fire it on every parent re-render that recreated those
  // handlers, tearing down the widget and discarding the issued token. The ref lets render read the latest
  // callbacks without re-mounting.
  const callbacksRef = useRef({ onSuccess, onError, onExpire });

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
    callbacksRef.current = { onSuccess, onError, onExpire };
  }, [onSuccess, onError, onExpire]);

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
          callback: (token) => callbacksRef.current.onSuccess(token),
          'error-callback': (error) => callbacksRef.current.onError?.(error),
          'expired-callback': () => callbacksRef.current.onExpire?.(),
          size: 'flexible',
          theme: 'auto',
          'retry-interval': TURNSTILE_RETRY_INTERVAL_MS,
          'refresh-expired': 'auto',
          'response-field': true
        });
      } catch {
        callbacksRef.current.onError?.('Failed to render Turnstile widget');
      }
    };

    if (window.turnstile) {
      renderWidget();
      return () => {
        cleanupExistingWidget();
      };
    }

    // Bounded poll for the Cloudflare script (25 × 200ms = 5s). _document.tsx loads it with `afterInteractive`,
    // which can lag behind component mount on slow networks. If `window.turnstile` never appears within the
    // budget we surface an error so ContactFormInner keeps the submit button disabled instead of leaving the
    // user staring at a missing widget.
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
        callbacksRef.current.onError?.('Turnstile script failed to load within timeout period');
      }
    }, SCRIPT_POLL_INTERVAL_MS);

    return () => {
      clearInterval(checkInterval);
      cleanupExistingWidget();
    };
  }, [siteKey]);

  return (
    <div className="max-w-[500px]">
      <div ref={containerRef} className="min-h-[65px] w-full" />
    </div>
  );
});

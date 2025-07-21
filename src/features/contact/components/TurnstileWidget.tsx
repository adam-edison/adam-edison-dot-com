import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadTurnstileScript } from '../utils/turnstile-loader';
import type { TurnstileInstance } from '@/types/turnstile';

interface TurnstileWidgetProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  className?: string;
}

export function TurnstileWidget({ siteKey, onVerify, onError, onExpire, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const refreshWidget = useCallback(() => {
    // Remove the old widget
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    // Clear states
    setError(null);
    setIsVerified(false);
    setIsLoading(true);

    // Re-render the widget
    if (containerRef.current && window.turnstile) {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'auto',
        size: 'normal',
        retry: 'never', // Manual retry control for VPN users
        'refresh-timeout': 'manual', // User controls refresh
        execution: 'render', // Load on page render, not submit
        callback: (token: string) => {
          setIsVerified(true);
          onVerify(token);
        },
        'error-callback': () => {
          setError('Verification failed. Please try again.');
          setIsVerified(false);
          onError?.();
        },
        'expired-callback': () => {
          setIsVerified(false);
          onExpire?.();
        },
        'timeout-callback': () => {
          setError('Verification timed out. Please try again.');
          setIsVerified(false);
        }
      });
      setIsLoading(false);
    }
  }, [siteKey, onVerify, onError, onExpire]);

  useEffect(() => {
    let mounted = true;

    const initializeTurnstile = async () => {
      try {
        await loadTurnstileScript();

        if (!mounted) return;

        if (containerRef.current && window.turnstile) {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            theme: 'auto',
            size: 'normal',
            retry: 'never', // Manual retry control for VPN users
            'refresh-timeout': 'manual', // User controls refresh
            execution: 'render', // Load on page render, not submit
            callback: (token: string) => {
              setIsVerified(true);
              onVerify(token);
            },
            'error-callback': () => {
              setError('Verification failed. Please try again.');
              setIsVerified(false);
              onError?.();
            },
            'expired-callback': () => {
              setIsVerified(false);
              onExpire?.();
            },
            'timeout-callback': () => {
              setError('Verification timed out. Please try again.');
              setIsVerified(false);
            }
          });
          setIsLoading(false);
        }
      } catch {
        if (!mounted) return;
        setError('Failed to load security verification. Please refresh the page.');
        setIsLoading(false);
      }
    };

    initializeTurnstile();

    return () => {
      mounted = false;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
    };
  }, [siteKey, onVerify, onError, onExpire]);

  return (
    <div className={className}>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300 mb-2">Security Verification *</label>

        {error && (
          <div className="text-sm text-red-400 mb-2">
            {error}
            <button
              type="button"
              onClick={refreshWidget}
              className="ml-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded"
            >
              Try again
            </button>
          </div>
        )}

        {isLoading && (
          <div className="bg-gray-800 border border-gray-600 rounded-md p-4 text-center text-gray-400">
            Loading security verification...
          </div>
        )}

        <div
          ref={containerRef}
          className={`turnstile-container ${isLoading ? 'hidden' : ''}`}
          data-testid="turnstile-widget"
        />

        {isVerified && <div className="text-sm text-green-400 mt-2">✓ Verification successful</div>}

        <div className="text-xs text-gray-400 mt-2">
          <p>This verification helps protect against spam while respecting your privacy.</p>
          {!isVerified && !error && !isLoading && (
            <p className="mt-1">Please complete the security check above to submit the form.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export const TurnstileWidgetInstance = React.forwardRef<TurnstileInstance, TurnstileWidgetProps>((props, ref) => {
  const widgetRef = useRef<string | null>(null);

  React.useImperativeHandle(ref, () => ({
    widgetId: widgetRef.current || '',
    reset: () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.reset(widgetRef.current);
      }
    },
    remove: () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
      }
    },
    getResponse: () => {
      if (widgetRef.current && window.turnstile) {
        return window.turnstile.getResponse(widgetRef.current);
      }
      return null;
    },
    execute: () => {
      if (widgetRef.current && window.turnstile) {
        window.turnstile.execute(widgetRef.current);
      }
    }
  }));

  return <TurnstileWidget {...props} />;
});

TurnstileWidgetInstance.displayName = 'TurnstileWidgetInstance';

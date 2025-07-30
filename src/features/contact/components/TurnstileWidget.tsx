import React, { useEffect, useRef, useState, useCallback } from 'react';
import { loadTurnstileScript } from '../utils/turnstile-loader';
import { Result } from '@/shared/Result';
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
  const initializationInProgressRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  const createTurnstileConfig = useCallback(
    () => ({
      sitekey: siteKey,
      theme: 'auto' as const,
      size: 'normal' as const,
      retry: 'never' as const, // Manual retry control for VPN users
      'refresh-timeout': 'manual' as const, // User controls refresh
      execution: 'render' as const, // Load on page render, not submit
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
    }),
    [siteKey, onVerify, onError, onExpire]
  );

  const cleanupWidget = useCallback(() => {
    if (!widgetIdRef.current) return;
    if (!window.turnstile) return;

    try {
      window.turnstile.remove(widgetIdRef.current);
    } catch {
      // Ignore cleanup errors - widget might already be removed
    }
    widgetIdRef.current = null;
  }, []);

  const clearContainer = useCallback(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';
  }, []);

  const resetWidgetStates = useCallback(() => {
    setError(null);
    setIsVerified(false);
    setIsLoading(true);
  }, []);

  const attemptWidgetRender = useCallback(() => {
    if (!containerRef.current) {
      initializationInProgressRef.current = false;
      return;
    }
    if (!window.turnstile) {
      initializationInProgressRef.current = false;
      return;
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, createTurnstileConfig());
      setIsLoading(false);
    } catch {
      setError('Failed to refresh security verification. Please try again.');
      setIsLoading(false);
    }

    initializationInProgressRef.current = false;
  }, [createTurnstileConfig]);

  const refreshWidget = useCallback(async () => {
    if (initializationInProgressRef.current) return;

    initializationInProgressRef.current = true;

    cleanupWidget();
    clearContainer();

    // Small delay to ensure cleanup is complete
    await new Promise((resolve) => setTimeout(resolve, 10));

    resetWidgetStates();
    attemptWidgetRender();
  }, [cleanupWidget, clearContainer, resetWidgetStates, attemptWidgetRender]);

  const loadScript = useCallback(async (): Promise<Result<void, string>> => {
    try {
      await loadTurnstileScript();
      return Result.success();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return Result.failure(`Failed to load security verification: ${errorMessage}`);
    }
  }, []);

  const validateContainer = useCallback((): Result<void, string> => {
    if (!containerRef.current) {
      return Result.failure('Turnstile widget container not available');
    }
    if (!window.turnstile) {
      return Result.failure('Turnstile widget container not available');
    }
    return Result.success();
  }, []);

  const renderWidget = useCallback((): Result<void, string> => {
    widgetIdRef.current = window.turnstile!.render(containerRef.current!, createTurnstileConfig());
    return Result.success();
  }, [createTurnstileConfig]);

  const initializeTurnstile = useCallback(async (): Promise<Result<void, string>> => {
    const scriptResult = await loadScript();
    if (!scriptResult.success) return scriptResult;

    const containerResult = validateContainer();
    if (!containerResult.success) return containerResult;

    return renderWidget();
  }, [loadScript, validateContainer, renderWidget]);

  const checkMountedState = useCallback((mounted: boolean): boolean => {
    if (!mounted) {
      initializationInProgressRef.current = false;
      return false;
    }
    return true;
  }, []);

  const processInitializationResult = useCallback((result: Result<void, string>) => {
    setIsLoading(false);
    if (!result.success) {
      setError(result.error);
    }
    initializationInProgressRef.current = false;
  }, []);

  useEffect(() => {
    let mounted = true;

    const handleInitialization = async () => {
      if (initializationInProgressRef.current) return;

      initializationInProgressRef.current = true;

      // Clean up any existing widget first
      cleanupWidget();
      clearContainer();

      // Small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (!checkMountedState(mounted)) return;

      const result = await initializeTurnstile();

      if (!checkMountedState(mounted)) return;

      processInitializationResult(result);
    };

    handleInitialization();

    return () => {
      mounted = false;
      initializationInProgressRef.current = false;
      cleanupWidget();
      clearContainer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]); // Only depend on siteKey to prevent unnecessary re-initializations

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

const createWidgetReset = (widgetRef: React.MutableRefObject<string | null>) => () => {
  if (!widgetRef.current) return;
  if (!window.turnstile) return;
  window.turnstile.reset(widgetRef.current);
};

const createWidgetRemove = (widgetRef: React.MutableRefObject<string | null>) => () => {
  if (!widgetRef.current) return;
  if (!window.turnstile) return;
  window.turnstile.remove(widgetRef.current);
};

const createWidgetGetResponse = (widgetRef: React.MutableRefObject<string | null>) => () => {
  if (!widgetRef.current) return null;
  if (!window.turnstile) return null;
  return window.turnstile.getResponse(widgetRef.current);
};

const createWidgetExecute = (widgetRef: React.MutableRefObject<string | null>) => () => {
  if (!widgetRef.current) return;
  if (!window.turnstile) return;
  window.turnstile.execute(widgetRef.current);
};

export const TurnstileWidgetInstance = React.forwardRef<TurnstileInstance, TurnstileWidgetProps>((props, ref) => {
  const widgetRef = useRef<string | null>(null);

  React.useImperativeHandle(ref, () => ({
    widgetId: widgetRef.current || '',
    reset: createWidgetReset(widgetRef),
    remove: createWidgetRemove(widgetRef),
    getResponse: createWidgetGetResponse(widgetRef),
    execute: createWidgetExecute(widgetRef)
  }));

  return <TurnstileWidget {...props} />;
});

TurnstileWidgetInstance.displayName = 'TurnstileWidgetInstance';

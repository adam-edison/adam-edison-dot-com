import { describe, expect, test, vi, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Turnstile } from '@/features/contact/components/Turnstile';

interface TurnstileMock {
  render: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
}

function installTurnstileMock(): TurnstileMock {
  const mock: TurnstileMock = {
    render: vi.fn().mockReturnValue('widget-id-test'),
    remove: vi.fn(),
    reset: vi.fn()
  };
  window.turnstile = mock as unknown as typeof window.turnstile;
  return mock;
}

function uninstallTurnstileMock(): void {
  delete window.turnstile;
}

const POLLING_UPPER_BOUND_MS = 10_000;

describe('Turnstile', () => {
  afterEach(() => {
    uninstallTurnstileMock();
    vi.useRealTimers();
  });

  test('calls onError within 10 seconds when the Turnstile script never loads', () => {
    vi.useFakeTimers();
    const onError = vi.fn();

    render(<Turnstile siteKey="test-site-key" onSuccess={vi.fn()} onError={onError} />);

    act(() => {
      vi.advanceTimersByTime(POLLING_UPPER_BOUND_MS);
    });

    expect(onError).toHaveBeenCalledWith(expect.stringContaining('Turnstile script failed to load'));
  });

  test('does not call onError if the script loads before the polling budget exhausts', () => {
    vi.useFakeTimers();
    const onError = vi.fn();

    render(<Turnstile siteKey="test-site-key" onSuccess={vi.fn()} onError={onError} />);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    installTurnstileMock();

    act(() => {
      vi.advanceTimersByTime(POLLING_UPPER_BOUND_MS);
    });

    expect(onError).not.toHaveBeenCalled();
  });

  test('does not call onError after unmount, even past the polling budget', () => {
    vi.useFakeTimers();
    const onError = vi.fn();

    const { unmount } = render(<Turnstile siteKey="test-site-key" onSuccess={vi.fn()} onError={onError} />);

    act(() => {
      vi.advanceTimersByTime(400);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(POLLING_UPPER_BOUND_MS);
    });

    expect(onError).not.toHaveBeenCalled();
  });
});

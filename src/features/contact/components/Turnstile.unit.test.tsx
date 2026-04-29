import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Turnstile } from './Turnstile';

interface TurnstileMock {
  render: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  __lastOptions?: Parameters<NonNullable<typeof window.turnstile>['render']>[1];
}

function installTurnstileMock(): TurnstileMock {
  const mock: TurnstileMock = {
    render: vi.fn(),
    remove: vi.fn(),
    reset: vi.fn()
  };
  mock.render.mockImplementation((_el, options) => {
    mock.__lastOptions = options;
    return 'widget-id-1';
  });
  window.turnstile = mock as unknown as typeof window.turnstile;
  return mock;
}

function uninstallTurnstileMock(): void {
  delete window.turnstile;
}

describe('Turnstile', () => {
  afterEach(() => {
    uninstallTurnstileMock();
    vi.useRealTimers();
  });

  describe('when script is already loaded', () => {
    beforeEach(() => {
      installTurnstileMock();
    });

    test('renders a container and calls turnstile.render with expected options', () => {
      const onSuccess = vi.fn();
      render(<Turnstile siteKey="test-site-key" onSuccess={onSuccess} />);

      const turnstileMock = window.turnstile as unknown as TurnstileMock;
      expect(turnstileMock.render).toHaveBeenCalledTimes(1);
      expect(turnstileMock.__lastOptions).toMatchObject({
        sitekey: 'test-site-key',
        size: 'flexible',
        theme: 'auto',
        'retry-interval': 8000,
        'refresh-expired': 'auto',
        'response-field': true
      });
    });

    test('forwards token to onSuccess when widget callback fires', () => {
      const onSuccess = vi.fn();
      render(<Turnstile siteKey="test-site-key" onSuccess={onSuccess} />);

      const turnstileMock = window.turnstile as unknown as TurnstileMock;
      turnstileMock.__lastOptions!.callback('issued-token-abc');

      expect(onSuccess).toHaveBeenCalledWith('issued-token-abc');
    });

    test('forwards widget error to onError when error-callback fires', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      render(<Turnstile siteKey="test-site-key" onSuccess={onSuccess} onError={onError} />);

      const turnstileMock = window.turnstile as unknown as TurnstileMock;
      turnstileMock.__lastOptions!['error-callback']!('widget-error');

      expect(onError).toHaveBeenCalledWith('widget-error');
    });

    test('removes widget on unmount', () => {
      const { unmount } = render(<Turnstile siteKey="test-site-key" onSuccess={vi.fn()} />);
      const turnstileMock = window.turnstile as unknown as TurnstileMock;

      unmount();

      expect(turnstileMock.remove).toHaveBeenCalledWith('widget-id-1');
    });
  });

  describe('when script never loads', () => {
    test('calls onError after polling exhausts retries', () => {
      vi.useFakeTimers();
      const onError = vi.fn();

      render(<Turnstile siteKey="test-site-key" onSuccess={vi.fn()} onError={onError} />);

      act(() => {
        vi.advanceTimersByTime(200 * 25 + 50);
      });

      expect(onError).toHaveBeenCalledWith(expect.stringContaining('Turnstile script failed to load'));
    });

    test('does not call onError if script loads before retries exhausted', () => {
      vi.useFakeTimers();
      const onError = vi.fn();
      const onSuccess = vi.fn();

      render(<Turnstile siteKey="test-site-key" onSuccess={onSuccess} onError={onError} />);

      act(() => {
        vi.advanceTimersByTime(400);
      });

      installTurnstileMock();

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(onError).not.toHaveBeenCalled();
      const turnstileMock = window.turnstile as unknown as TurnstileMock;
      expect(turnstileMock.render).toHaveBeenCalled();
    });
  });
});

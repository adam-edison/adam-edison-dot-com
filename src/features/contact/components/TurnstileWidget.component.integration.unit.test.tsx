import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { TurnstileWidget } from './TurnstileWidget';
import { loadTurnstileScript } from '../utils/turnstile-loader';

// Mock the turnstile loader
vi.mock('../utils/turnstile-loader', () => ({
  loadTurnstileScript: vi.fn()
}));

// Mock the service hooks
vi.mock('./ServiceStatusManager', () => ({
  useServiceStatus: vi.fn()
}));

vi.mock('./FormSubmissionHandler', () => ({
  useFormSubmission: vi.fn()
}));

vi.mock('./TurnstileManager', () => ({
  useTurnstileManager: vi.fn()
}));

// Mock fetch for CSRF token and service status
global.fetch = vi.fn();

// Mock window.turnstile
const mockTurnstile = {
  render: vi.fn(),
  remove: vi.fn(),
  reset: vi.fn(),
  getResponse: vi.fn(),
  execute: vi.fn(),
  ready: vi.fn()
};

describe('TurnstileWidget Integration Tests', () => {
  const mockSiteKey = 'test-site-key';

  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).turnstile = mockTurnstile;
    mockTurnstile.render.mockReturnValue('widget-123');
    (loadTurnstileScript as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).turnstile;
  });

  describe('Widget State Management Integration', () => {
    it('should properly manage state transitions through all phases', async () => {
      const onVerify = vi.fn();
      const onError = vi.fn();
      const onExpire = vi.fn();

      render(<TurnstileWidget siteKey={mockSiteKey} onVerify={onVerify} onError={onError} onExpire={onExpire} />);

      // Phase 1: Initial loading state
      expect(screen.getByText('Loading security verification...')).toBeInTheDocument();

      // Phase 2: Widget loaded and rendered
      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalled();
        expect(screen.queryByText('Loading security verification...')).not.toBeInTheDocument();
      });

      // Phase 3: Simulate verification success
      const renderCall = mockTurnstile.render.mock.calls[0];
      const callbacks = renderCall[1];

      act(() => {
        callbacks.callback('test-token');
      });

      expect(onVerify).toHaveBeenCalledWith('test-token');
      expect(screen.getByText('✓ Verification successful')).toBeInTheDocument();

      // Phase 4: Simulate token expiration and reset
      act(() => {
        callbacks['expired-callback']();
      });

      expect(onExpire).toHaveBeenCalled();
      expect(screen.queryByText('✓ Verification successful')).not.toBeInTheDocument();

      // Phase 5: Simulate error and recovery
      act(() => {
        callbacks['error-callback']();
      });

      expect(onError).toHaveBeenCalled();
      expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument();

      // Phase 6: Test retry mechanism
      const retryButton = screen.getByText('Try again');
      act(() => {
        fireEvent.click(retryButton);
      });

      await waitFor(() => {
        expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-123');
        expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle script loading failures gracefully with Result pattern', async () => {
      const mockError = new Error('Network failure');
      (loadTurnstileScript as ReturnType<typeof vi.fn>).mockRejectedValue(mockError);

      const onVerify = vi.fn();

      render(<TurnstileWidget siteKey={mockSiteKey} onVerify={onVerify} />);

      // Should start in loading state
      expect(screen.getByText('Loading security verification...')).toBeInTheDocument();

      // Should show error after failed load
      await waitFor(() => {
        expect(screen.getByText('Failed to load security verification: Network failure')).toBeInTheDocument();
      });

      // Should not show loading or success states
      expect(screen.queryByText('Loading security verification...')).not.toBeInTheDocument();
      expect(screen.queryByText('✓ Verification successful')).not.toBeInTheDocument();
    });
  });

  describe('Configuration Integration', () => {
    it('should use shared configuration consistently across render and refresh', async () => {
      const onVerify = vi.fn();

      render(<TurnstileWidget siteKey={mockSiteKey} onVerify={onVerify} />);

      // Wait for initial render
      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalledTimes(1);
      });

      const initialRenderCall = mockTurnstile.render.mock.calls[0];
      const initialConfig = initialRenderCall[1];

      // Trigger an error to cause a refresh
      act(() => {
        initialConfig['error-callback']();
      });

      const retryButton = screen.getByText('Try again');
      act(() => {
        fireEvent.click(retryButton);
      });

      // Wait for refresh render
      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
      });

      const refreshRenderCall = mockTurnstile.render.mock.calls[1];
      const refreshConfig = refreshRenderCall[1];

      // Both configurations should be identical (testing DRY fix)
      expect(initialConfig.sitekey).toBe(refreshConfig.sitekey);
      expect(initialConfig.theme).toBe(refreshConfig.theme);
      expect(initialConfig.size).toBe(refreshConfig.size);
      expect(initialConfig.retry).toBe(refreshConfig.retry);
      expect(initialConfig['refresh-timeout']).toBe(refreshConfig['refresh-timeout']);
      expect(initialConfig.execution).toBe(refreshConfig.execution);
    });

    it('should handle different site keys correctly', async () => {
      const { rerender } = render(<TurnstileWidget siteKey="site-key-1" onVerify={vi.fn()} />);

      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalledTimes(1);
      });

      const firstCall = mockTurnstile.render.mock.calls[0];
      expect(firstCall[1].sitekey).toBe('site-key-1');

      // Rerender with different site key
      rerender(<TurnstileWidget siteKey="site-key-2" onVerify={vi.fn()} />);

      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
      });

      const secondCall = mockTurnstile.render.mock.calls[1];
      expect(secondCall[1].sitekey).toBe('site-key-2');
    });
  });

  describe('Error Recovery Integration', () => {
    it('should properly clean up and reinitialize after multiple failures', async () => {
      const onVerify = vi.fn();

      render(<TurnstileWidget siteKey={mockSiteKey} onVerify={onVerify} />);

      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalledTimes(1);
      });

      // Simulate multiple error scenarios
      const renderCall = mockTurnstile.render.mock.calls[0];
      const callbacks = renderCall[1];

      // Error 1: Verification fails
      act(() => {
        callbacks['error-callback']();
      });

      expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument();

      // Retry 1
      fireEvent.click(screen.getByText('Try again'));

      await waitFor(() => {
        expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-123');
        expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
      });

      // Error 2: Timeout
      const secondRenderCall = mockTurnstile.render.mock.calls[1];
      const secondCallbacks = secondRenderCall[1];

      act(() => {
        secondCallbacks['timeout-callback']();
      });

      expect(screen.getByText('Verification timed out. Please try again.')).toBeInTheDocument();

      // Retry 2
      fireEvent.click(screen.getByText('Try again'));

      await waitFor(() => {
        expect(mockTurnstile.remove).toHaveBeenCalledTimes(2);
        expect(mockTurnstile.render).toHaveBeenCalledTimes(3);
      });

      // Final success
      const thirdRenderCall = mockTurnstile.render.mock.calls[2];
      const thirdCallbacks = thirdRenderCall[1];

      act(() => {
        thirdCallbacks.callback('success-token');
      });

      expect(onVerify).toHaveBeenCalledWith('success-token');
      expect(screen.getByText('✓ Verification successful')).toBeInTheDocument();
    });
  });

  describe('Memory Management Integration', () => {
    it('should properly clean up resources across multiple mount/unmount cycles', async () => {
      const onVerify = vi.fn();

      // First mount
      const { unmount } = render(<TurnstileWidget siteKey={mockSiteKey} onVerify={onVerify} />);

      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalledTimes(1);
      });

      // First unmount
      unmount();
      expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-123');

      // Second mount with different props
      const { unmount: unmount2 } = render(<TurnstileWidget siteKey="different-key" onVerify={vi.fn()} />);

      mockTurnstile.render.mockReturnValue('widget-456');

      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
      });

      // Second unmount
      unmount2();
      expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-456');

      // Verify no memory leaks or stale references
      expect(mockTurnstile.remove).toHaveBeenCalledTimes(2);
      expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility Integration', () => {
    it('should maintain proper ARIA labels and structure throughout widget lifecycle', async () => {
      render(<TurnstileWidget siteKey={mockSiteKey} onVerify={vi.fn()} />);

      // Check initial accessibility structure
      expect(screen.getByText('Security Verification *')).toBeInTheDocument();
      const container = screen.getByTestId('turnstile-widget');
      expect(container).toBeInTheDocument();

      await waitFor(() => {
        expect(mockTurnstile.render).toHaveBeenCalled();
      });

      // Check accessibility after load
      expect(
        screen.getByText('This verification helps protect against spam while respecting your privacy.')
      ).toBeInTheDocument();

      // Simulate error state and check accessibility
      const renderCall = mockTurnstile.render.mock.calls[0];
      const callbacks = renderCall[1];

      act(() => {
        callbacks['error-callback']();
      });

      const retryButton = screen.getByText('Try again');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton.tagName).toBe('BUTTON');

      // Simulate success state and check accessibility
      act(() => {
        callbacks.callback('test-token');
      });

      expect(screen.getByText('✓ Verification successful')).toBeInTheDocument();
    });
  });
});

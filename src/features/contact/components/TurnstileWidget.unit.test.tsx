import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { TurnstileWidget } from './TurnstileWidget';
import { loadTurnstileScript } from '../utils/turnstile-loader';

// Mock the turnstile loader
vi.mock('../utils/turnstile-loader', () => ({
  loadTurnstileScript: vi.fn()
}));

// Mock window.turnstile
const mockTurnstile = {
  render: vi.fn(),
  remove: vi.fn(),
  reset: vi.fn(),
  getResponse: vi.fn(),
  execute: vi.fn()
};

describe('TurnstileWidget', () => {
  const mockSiteKey = 'test-site-key';
  const mockOnVerify = vi.fn();
  const mockOnError = vi.fn();
  const mockOnExpire = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (window as typeof window & { turnstile?: typeof mockTurnstile }).turnstile = mockTurnstile;
    mockTurnstile.render.mockReturnValue('widget-123');
  });

  afterEach(() => {
    delete (window as typeof window & { turnstile?: typeof mockTurnstile }).turnstile;
  });

  it('should render loading state initially', () => {
    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} />);

    expect(screen.getByText('Loading security verification...')).toBeInTheDocument();
    expect(screen.getByText('Security Verification *')).toBeInTheDocument();
  });

  it('should load Turnstile script and render widget', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} />);

    await waitFor(() => {
      expect(loadTurnstileScript).toHaveBeenCalled();
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    const renderCall = mockTurnstile.render.mock.calls[0];
    expect(renderCall[1]).toMatchObject({
      sitekey: mockSiteKey,
      theme: 'auto',
      size: 'normal',
      retry: 'never',
      'refresh-timeout': 'manual',
      execution: 'render'
    });
  });

  it('should call onVerify when verification succeeds', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);
    const mockToken = 'test-token-123';

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate successful verification
    const renderCall = mockTurnstile.render.mock.calls[0];
    const callbacks = renderCall[1];

    act(() => {
      callbacks.callback(mockToken);
    });

    expect(mockOnVerify).toHaveBeenCalledWith(mockToken);
    expect(screen.getByText('✓ Verification successful')).toBeInTheDocument();
  });

  it('should show error message when verification fails', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} onError={mockOnError} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate error
    const renderCall = mockTurnstile.render.mock.calls[0];
    const callbacks = renderCall[1];

    act(() => {
      callbacks['error-callback']();
    });

    expect(mockOnError).toHaveBeenCalled();
    expect(screen.getByText('Verification failed. Please try again.')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('should handle expired token', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} onExpire={mockOnExpire} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate token expiration
    const renderCall = mockTurnstile.render.mock.calls[0];
    const callbacks = renderCall[1];

    act(() => {
      callbacks['expired-callback']();
    });

    expect(mockOnExpire).toHaveBeenCalled();
  });

  it('should handle timeout', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate timeout
    const renderCall = mockTurnstile.render.mock.calls[0];
    const callbacks = renderCall[1];

    act(() => {
      callbacks['timeout-callback']();
    });

    expect(screen.getByText('Verification timed out. Please try again.')).toBeInTheDocument();
  });

  it('should handle script loading failure', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockRejectedValue(
      new Error('Failed to load')
    );

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load security verification: Failed to load')).toBeInTheDocument();
    });
  });

  it('should refresh widget when try again is clicked', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} onError={mockOnError} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    // Simulate error
    const renderCall = mockTurnstile.render.mock.calls[0];
    const callbacks = renderCall[1];

    act(() => {
      callbacks['error-callback']();
    });

    // Click try again
    const tryAgainButton = screen.getByText('Try again');

    act(() => {
      fireEvent.click(tryAgainButton);
    });

    await waitFor(() => {
      expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-123');
      expect(mockTurnstile.render).toHaveBeenCalledTimes(2);
    });
  });

  it('should cleanup on unmount', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);

    const { unmount } = render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    unmount();

    expect(mockTurnstile.remove).toHaveBeenCalledWith('widget-123');
  });

  it('should apply custom className', () => {
    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} className="custom-class" />);

    const container = screen.getByText('Security Verification *').closest('div')?.parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('should show help text when not verified', async () => {
    (loadTurnstileScript as typeof window & { turnstile?: typeof mockTurnstile }).mockResolvedValue(undefined);

    render(<TurnstileWidget siteKey={mockSiteKey} onVerify={mockOnVerify} />);

    await waitFor(() => {
      expect(mockTurnstile.render).toHaveBeenCalled();
    });

    expect(
      screen.getByText('This verification helps protect against spam while respecting your privacy.')
    ).toBeInTheDocument();
    expect(screen.getByText('Please complete the security check above to submit the form.')).toBeInTheDocument();
  });
});

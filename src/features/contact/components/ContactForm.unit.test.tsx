import { expect, test, describe, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContactForm } from './ContactForm';

// Mock the ContactFormInner component
const mockContactFormInner = vi.fn();
vi.mock('./ContactFormInner', () => ({
  ContactFormInner: (props: React.ComponentProps<'div'>) => mockContactFormInner(props)
}));

// Mock the ContactFormErrorBoundary component
vi.mock('./ContactFormErrorBoundary', () => ({
  ContactFormErrorBoundary: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContactFormInner.mockReturnValue(<div data-testid="contact-form-inner">Contact Form Inner</div>);
  });

  test('should render ContactFormInner within ErrorBoundary', () => {
    render(<ContactForm className="test-class" />);

    expect(screen.getByTestId('contact-form-inner')).toBeInTheDocument();
    expect(mockContactFormInner).toHaveBeenCalledWith({
      className: 'test-class'
    });
  });

  test('should pass className prop to ContactFormInner', () => {
    const testClassName = 'custom-form-class';
    render(<ContactForm className={testClassName} />);

    expect(mockContactFormInner).toHaveBeenCalledWith({
      className: testClassName
    });
  });

  test('should render without className', () => {
    render(<ContactForm />);

    expect(mockContactFormInner).toHaveBeenCalledWith({
      className: undefined
    });
    expect(screen.getByTestId('contact-form-inner')).toBeInTheDocument();
  });
});

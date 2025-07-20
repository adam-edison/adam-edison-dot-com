import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactFormInner } from './ContactFormInner';

// Mock the AntiBotService
const mockGenerateMathChallenge = vi.fn();
const mockValidateAntiBotData = vi.fn();
const mockCreateFormInitialData = vi.fn();

vi.mock('../AntiBotService', () => ({
  AntiBotService: {
    create: () => ({
      generateMathChallenge: mockGenerateMathChallenge,
      validateAntiBotData: mockValidateAntiBotData,
      createFormInitialData: mockCreateFormInitialData
    })
  }
}));

// Mock fetch
global.fetch = vi.fn();

describe('ContactFormInner', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockCreateFormInitialData.mockReturnValue({
      subject: '',
      phone: '',
      formLoadTime: Date.now(),
      mathAnswer: '',
      mathNum1: 3,
      mathNum2: 4
    });

    mockGenerateMathChallenge.mockReturnValue({
      num1: 5,
      num2: 6,
      question: 'What is 5 + 6?',
      correctAnswer: 11
    });

    mockValidateAntiBotData.mockReturnValue({
      isValid: true
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Success' })
    });
  });

  it('should render backup fields as hidden inputs', () => {
    render(<ContactFormInner />);

    const subject = screen.getByTestId('subject');
    const phone = screen.getByTestId('phone');

    expect(subject).toBeInTheDocument();
    expect(subject).toHaveStyle('display: none');
    expect(subject).toHaveAttribute('tabindex', '-1');
    expect(subject).toHaveAttribute('autocomplete', 'off');

    expect(phone).toBeInTheDocument();
    expect(phone).toHaveStyle('display: none');
    expect(phone).toHaveAttribute('tabindex', '-1');
    expect(phone).toHaveAttribute('autocomplete', 'off');
  });

  it('should render math challenge question', () => {
    render(<ContactFormInner />);

    expect(screen.getByText('Security Question:')).toBeInTheDocument();
    expect(screen.getByText('What is 3 + 4?')).toBeInTheDocument();
    expect(screen.getByLabelText(/What is 3 \+ 4\?/)).toBeInTheDocument();
  });

  it('should allow user to answer math question', async () => {
    render(<ContactFormInner />);

    const mathInput = screen.getByLabelText(/What is 3 \+ 4\?/);
    await user.type(mathInput, '7');

    expect(mathInput).toHaveValue(7);
  });

  it('should generate new math challenge when wrong answer is submitted', async () => {
    mockValidateAntiBotData.mockReturnValue({
      isValid: false,
      reason: 'Incorrect math answer'
    });

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Incorrect math answer' })
    });

    render(<ContactFormInner />);

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');
    await user.type(screen.getByLabelText(/What is 3 \+ 4\?/), '999'); // Wrong answer

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(mockGenerateMathChallenge).toHaveBeenCalled();
    });

    // Should show new math question
    expect(screen.getByText('What is 5 + 6?')).toBeInTheDocument();

    // Form fields should retain values
    expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test message with enough characters to pass validation')).toBeInTheDocument();

    // Math answer should be cleared
    const mathInput = screen.getByLabelText(/What is 5 \+ 6\?/);
    expect(mathInput).toHaveValue(null);
  });

  it('should not submit form when backup fields are filled', async () => {
    mockValidateAntiBotData.mockReturnValue({
      isValid: false,
      reason: 'Backup field detected'
    });

    render(<ContactFormInner />);

    // Simulate bot filling backup field
    const subject = screen.getByTestId('subject');
    fireEvent.change(subject, { target: { value: 'bot@spam.com' } });

    // Fill out visible form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');
    await user.type(screen.getByLabelText(/What is 3 \+ 4\?/), '7');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Should not make API call
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // Should show error message
    expect(screen.getByText(/security verification failed/i)).toBeInTheDocument();
  });

  it('should not submit form when submitted too quickly', async () => {
    mockValidateAntiBotData.mockReturnValue({
      isValid: false,
      reason: 'Form submitted too quickly'
    });

    render(<ContactFormInner />);

    // Fill out form quickly
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');
    await user.type(screen.getByLabelText(/What is 3 \+ 4\?/), '7');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    // Should not make API call
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });

    // Should show error message
    expect(screen.getByText(/please wait a moment before submitting/i)).toBeInTheDocument();
  });

  it('should submit form successfully with valid anti-bot data', async () => {
    render(<ContactFormInner />);

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');
    await user.type(screen.getByLabelText(/What is 3 \+ 4\?/), '7');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: expect.stringContaining('"firstName":"Test"')
      });
    });

    // Should show success message
    expect(screen.getByText('Message Sent!')).toBeInTheDocument();
  });

  it('should include anti-bot data in form submission', async () => {
    render(<ContactFormInner />);

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');
    await user.type(screen.getByLabelText(/What is 3 \+ 4\?/), '7');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody).toMatchObject({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      message: 'Test message with enough characters to pass validation',
      antiBotData: {
        subject: '',
        phone: '',
        formLoadTime: expect.any(Number),
        mathAnswer: '7',
        mathNum1: 3,
        mathNum2: 4
      }
    });
  });

  it('should reset form after successful submission', async () => {
    render(<ContactFormInner />);

    // Fill out form
    await user.type(screen.getByLabelText(/first name/i), 'Test');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Test message with enough characters to pass validation');
    await user.type(screen.getByLabelText(/What is 3 \+ 4\?/), '7');

    // Submit form
    await user.click(screen.getByRole('button', { name: /send message/i }));

    await waitFor(() => {
      expect(screen.getByText('Message Sent!')).toBeInTheDocument();
    });

    // Click "Send another message" to show the form again
    await user.click(screen.getByText(/send another message/i));

    // Form should be reset
    expect(screen.getByLabelText(/first name/i)).toHaveValue('');
    expect(screen.getByLabelText(/last name/i)).toHaveValue('');
    expect(screen.getByLabelText(/email/i)).toHaveValue('');
    expect(screen.getByLabelText(/message/i)).toHaveValue('');
    expect(screen.getByLabelText(/What is 3 \+ 4\?/)).toHaveValue(null); // New math question
  });
});

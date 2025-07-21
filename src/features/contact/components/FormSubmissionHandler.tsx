import { useState } from 'react';
import { ContactFormData } from '@/features/contact/ContactFormValidator';
import { logger } from '@/shared/Logger';

export interface FormSubmissionState {
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
}

export interface FormSubmissionActions {
  submitForm: (data: ContactFormData, turnstileToken: string, csrfToken: string) => Promise<void>;
  resetSubmissionState: () => void;
  setSubmissionError: (message: string) => void;
}

export function useFormSubmission(): FormSubmissionState & FormSubmissionActions {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const submitContactForm = async (
    data: ContactFormData,
    turnstileToken: string,
    csrfToken: string
  ): Promise<Response> => {
    return fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken
      },
      body: JSON.stringify({
        ...data,
        turnstileToken
      })
    });
  };

  const handleApiError = async (response: Response): Promise<void> => {
    const errorData = await response.json();
    setSubmitStatus('error');
    setErrorMessage(errorData.message || 'Failed to send message');
  };

  const handleUnexpectedError = (error: unknown): void => {
    logger.error('Contact form submission error:', error);
    setSubmitStatus('error');

    if (error instanceof Error) {
      setErrorMessage(error.message);
      return;
    }

    setErrorMessage('An unexpected error occurred. Please try again.');
  };

  const submitForm = async (data: ContactFormData, turnstileToken: string, csrfToken: string): Promise<void> => {
    if (!turnstileToken) {
      throw new Error('Please complete the security verification');
    }

    if (!csrfToken) {
      throw new Error('A security token is required to send a message');
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await submitContactForm(data, turnstileToken, csrfToken);

      if (!response.ok) {
        await handleApiError(response);
        return;
      }

      setSubmitStatus('success');
    } catch (error) {
      handleUnexpectedError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSubmissionState = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const setSubmissionError = (message: string) => {
    setSubmitStatus('error');
    setErrorMessage(message);
  };

  return {
    isSubmitting,
    submitStatus,
    errorMessage,
    submitForm,
    resetSubmissionState,
    setSubmissionError
  };
}

import { useState } from 'react';
import { ContactFormData } from '@/features/contact/ContactFormValidator';
import { Result } from '@/shared/Result';
import { logger } from '@/shared/Logger';

export interface FormSubmissionState {
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
}

export interface FormSubmissionActions {
  submitForm: (data: ContactFormData, turnstileToken: string | null, csrfToken: string) => Promise<void>;
  resetSubmissionState: () => void;
  setSubmissionError: (message: string) => void;
}

export function useFormSubmission(): FormSubmissionState & FormSubmissionActions {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const submitContactForm = async (
    data: ContactFormData,
    turnstileToken: string | null,
    csrfToken: string
  ): Promise<Result<void, string>> => {
    try {
      const requestBody: ContactFormData & { turnstileToken?: string } = { ...data };
      if (turnstileToken) {
        requestBody.turnstileToken = turnstileToken;
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send message' }));
        return Result.failure(errorData.message || 'Failed to send message');
      }

      return Result.success();
    } catch (error) {
      logger.error('Contact form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      return Result.failure(errorMessage);
    }
  };

  const submitForm = async (data: ContactFormData, turnstileToken: string | null, csrfToken: string): Promise<void> => {
    if (!csrfToken) {
      setSubmitStatus('error');
      setErrorMessage('A security token is required to send a message');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const result = await submitContactForm(data, turnstileToken, csrfToken);

    if (result.success) {
      setSubmitStatus('success');
    } else {
      setSubmitStatus('error');
      setErrorMessage(result.error);
    }

    setIsSubmitting(false);
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

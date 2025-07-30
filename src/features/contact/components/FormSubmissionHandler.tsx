import { useState } from 'react';
import { ContactFormData } from '@/features/contact/ContactFormValidator';
import { Result } from '@/shared/Result';
import { logger } from '@/shared/Logger';
import { ContactFormService } from '../ContactFormService';

export interface FormSubmissionState {
  isSubmitting: boolean;
  submitStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
}

export interface FormSubmissionActions {
  submitForm: (
    data: ContactFormData,
    turnstileToken: string | null,
    csrfToken: string
  ) => Promise<Result<void, string>>;
  resetSubmissionState: () => void;
  setSubmissionError: (message: string) => void;
}

export function useFormSubmission(contactService: ContactFormService): FormSubmissionState & FormSubmissionActions {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const submitContactForm = async (
    data: ContactFormData,
    turnstileToken: string | null,
    csrfToken: string
  ): Promise<Result<void, string>> => {
    try {
      const result = await contactService.submitForm(data, turnstileToken, csrfToken);

      if (result.success) {
        return Result.success();
      } else {
        return Result.failure(result.message);
      }
    } catch (error) {
      logger.error('Contact form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
      return Result.failure(errorMessage);
    }
  };

  const submitForm = async (
    data: ContactFormData,
    turnstileToken: string | null,
    csrfToken: string
  ): Promise<Result<void, string>> => {
    if (!csrfToken) {
      const errorMessage = 'A security token is required to send a message';
      setSubmitStatus('error');
      setErrorMessage(errorMessage);
      return Result.failure(errorMessage);
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    const result = await submitContactForm(data, turnstileToken, csrfToken);

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitStatus('error');
      setErrorMessage(result.error);
      return Result.failure(result.error);
    }

    setSubmitStatus('success');
    return Result.success();
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

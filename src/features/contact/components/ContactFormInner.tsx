import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { ContactFormValidator, ContactFormData } from '@/features/contact/ContactFormValidator';
import { ContactSuccessMessage } from './ContactSuccessMessage';
import { StatusCard } from '@/shared/components/ui/StatusCard';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { SubmitButton } from './SubmitButton';
import { RecaptchaNotice } from './RecaptchaNotice';
import { logger } from '@/shared/Logger';

interface ContactFormInnerProps {
  className?: string;
}

export function ContactFormInner({ className }: ContactFormInnerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormValidator.schema),
    mode: 'onChange'
  });

  const watchedMessage = useWatch({ control, name: 'message' });

  const executeRecaptchaWithTimeout = async (): Promise<string> => {
    if (!executeRecaptcha) {
      logger.warn('reCAPTCHA not ready, proceeding anyway (fail-open)');
      return '';
    }

    try {
      const timeoutMs = parseInt(process.env.NEXT_PUBLIC_RECAPTCHA_TIMEOUT_MS!);
      const recaptchaToken = await Promise.race([
        executeRecaptcha('contact_form'),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('reCAPTCHA timeout')), timeoutMs))
      ]);
      return recaptchaToken;
    } catch (error) {
      logger.warn('reCAPTCHA failed, proceeding anyway (fail-open):', error);
      return '';
    }
  };

  const submitContactForm = async (data: ContactFormData, recaptchaToken: string): Promise<Response> => {
    return fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...data,
        recaptchaToken
      })
    });
  };

  const handleApiError = async (response: Response): Promise<void> => {
    const errorData = await response.json();
    setSubmitStatus('error');

    let friendlyMessage = errorData.message || 'Failed to send message';
    if (friendlyMessage.includes('reCAPTCHA')) {
      friendlyMessage = 'Security verification failed. Please refresh the page and try again.';
    }

    setErrorMessage(friendlyMessage);
  };

  const handleUnexpectedError = (error: unknown): void => {
    logger.error('Contact form submission error:', error);
    setSubmitStatus('error');

    if (error instanceof Error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const recaptchaToken = await executeRecaptchaWithTimeout();
      const response = await submitContactForm(data, recaptchaToken);

      if (!response.ok) {
        await handleApiError(response);
        return;
      }

      setSubmitStatus('success');
      reset();
    } catch (error) {
      handleUnexpectedError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  if (submitStatus === 'success') {
    return <ContactSuccessMessage className={className} onSendAnother={handleSendAnother} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${className} space-y-6`}>
      {submitStatus === 'error' && errorMessage && <StatusCard variant="error" message={errorMessage} showIcon />}

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          id="firstName"
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          required
          register={register}
          error={errors.firstName}
        />
        <InputField
          id="lastName"
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          required
          register={register}
          error={errors.lastName}
        />
      </div>

      <InputField
        id="email"
        label="Email Address"
        type="email"
        placeholder="Enter your email address"
        required
        register={register}
        error={errors.email}
      />

      <TextareaField
        id="message"
        label="Message"
        placeholder="Enter your message (50-1000 characters)"
        required
        register={register}
        error={errors.message}
        rows={6}
        minLength={50}
        maxLength={1000}
        watchedValue={watchedMessage}
      />

      <RecaptchaNotice />
      <SubmitButton isSubmitting={isSubmitting} />
    </form>
  );
}

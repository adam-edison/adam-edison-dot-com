import React, { useState, useCallback, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactFormValidator, ContactFormData } from '@/features/contact/ContactFormValidator';
import { ContactSuccessMessage } from './ContactSuccessMessage';
import { StatusCard } from '@/shared/components/ui/StatusCard';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { SubmitButton } from './SubmitButton';
import { Turnstile, type TurnstileHandle } from './Turnstile';
import { logger } from '@/shared/Logger';

interface ContactFormInnerProps {
  className?: string;
  siteKey: string;
}

export function ContactFormInner({ className, siteKey }: ContactFormInnerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileHandle | null>(null);

  const resetTurnstile = useCallback(() => {
    setTurnstileToken('');
    turnstileRef.current?.reset();
  }, []);

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

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileError = useCallback((error: string) => {
    logger.warn(`Turnstile error: ${error}`);
    setTurnstileToken('');
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken('');
  }, []);

  const submitContactForm = async (data: ContactFormData, turnstileToken: string): Promise<Response> => {
    return fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ...data, turnstileToken })
    });
  };

  const handleApiError = async (response: Response): Promise<void> => {
    const errorData = await response.json();
    setSubmitStatus('error');
    setErrorMessage(errorData.message || 'Failed to send message');
    resetTurnstile();
  };

  const handleUnexpectedError = (error: unknown): void => {
    logger.error('Contact form submission error:', error);
    setSubmitStatus('error');

    if (error instanceof Error) {
      setErrorMessage(error.message);
    } else {
      setErrorMessage('An unexpected error occurred. Please try again.');
    }
    resetTurnstile();
  };

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await submitContactForm(data, turnstileToken);

      if (!response.ok) {
        await handleApiError(response);
        return;
      }

      setSubmitStatus('success');
      reset();
      resetTurnstile();
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

      <Turnstile
        ref={turnstileRef}
        siteKey={siteKey}
        onSuccess={handleTurnstileSuccess}
        onError={handleTurnstileError}
        onExpire={handleTurnstileExpire}
      />

      <SubmitButton isSubmitting={isSubmitting} disabled={!turnstileToken} />
    </form>
  );
}

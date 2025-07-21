import React, { useState, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactFormValidator, ContactFormData } from '@/features/contact/ContactFormValidator';
import { ContactSuccessMessage } from './ContactSuccessMessage';
import { StatusCard } from '@/shared/components/ui/StatusCard';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { SubmitButton } from './SubmitButton';
import { TurnstileWidget } from './TurnstileWidget';
import { logger } from '@/shared/Logger';

interface ContactFormInnerProps {
  className?: string;
}

export function ContactFormInner({ className }: ContactFormInnerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileResetRef = useRef<(() => void) | null>(null);

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

  const submitContactForm = async (data: ContactFormData): Promise<Response> => {
    if (!turnstileToken) {
      throw new Error('Please complete the security verification');
    }

    return fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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

  const onSubmit = async (data: ContactFormData) => {
    if (!turnstileToken) {
      setSubmitStatus('error');
      setErrorMessage('Please complete the security verification');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const response = await submitContactForm(data);

      if (!response.ok) {
        await handleApiError(response);
        return;
      }

      setSubmitStatus('success');
      reset();
      setTurnstileToken(null);
      // Reset Turnstile widget
      if (turnstileResetRef.current) {
        turnstileResetRef.current();
      }
    } catch (error) {
      handleUnexpectedError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
    setTurnstileToken(null);
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    // Clear any previous verification errors
    if (submitStatus === 'error' && errorMessage === 'Please complete the security verification') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
  };

  if (submitStatus === 'success') {
    return <ContactSuccessMessage className={className} onSendAnother={handleSendAnother} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${className} space-y-6`}>
      {submitStatus === 'error' && errorMessage && (
        <StatusCard variant="error" message={errorMessage} showIcon data-testid="error-message" />
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          id="firstName"
          label="First Name"
          type="text"
          placeholder="Enter your first name"
          required
          register={register}
          error={errors.firstName}
          data-testid="contact-first-name"
        />
        <InputField
          id="lastName"
          label="Last Name"
          type="text"
          placeholder="Enter your last name"
          required
          register={register}
          error={errors.lastName}
          data-testid="contact-last-name"
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
        data-testid="contact-email"
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
        data-testid="contact-message"
      />

      {/* Cloudflare Turnstile Widget */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <TurnstileWidget
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
          onVerify={handleTurnstileVerify}
          onExpire={handleTurnstileExpire}
          className="my-6"
        />
      )}

      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={!turnstileToken && !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
        data-testid="submit-button"
      />
    </form>
  );
}

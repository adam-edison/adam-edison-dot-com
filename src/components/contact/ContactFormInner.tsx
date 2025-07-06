import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { contactFormSchema, ContactFormData } from '@/lib/validations/contact';
import { ContactSuccessMessage } from './ContactSuccessMessage';
import { StatusCard } from '@/components/ui/StatusCard';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { SubmitButton } from './SubmitButton';
import { RecaptchaNotice } from './RecaptchaNotice';

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
    resolver: zodResolver(contactFormSchema),
    mode: 'onChange'
  });

  const watchedMessage = useWatch({ control, name: 'message' });

  const onSubmit = async (data: ContactFormData) => {
    if (!executeRecaptcha) {
      setErrorMessage('reCAPTCHA not ready. Please try again.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const recaptchaToken = await executeRecaptcha('contact_form');

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          recaptchaToken
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setSubmitStatus('error');

        // Provide user-friendly error messages
        let friendlyMessage = errorData.message || 'Failed to send message';
        if (friendlyMessage.includes('reCAPTCHA')) {
          friendlyMessage = 'Security verification failed. Please refresh the page and try again.';
        }

        setErrorMessage(friendlyMessage);
        return;
      }

      setSubmitStatus('success');
      reset();
    } catch (error) {
      console.error('Contact form submission error:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
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

      <InputField
        id="confirmEmail"
        label="Confirm Email Address"
        type="email"
        placeholder="Confirm your email address"
        required
        register={register}
        error={errors.confirmEmail}
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

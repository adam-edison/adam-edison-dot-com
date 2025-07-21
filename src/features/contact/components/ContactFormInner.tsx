import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactFormValidator, ContactFormData } from '@/features/contact/ContactFormValidator';
import { ContactSuccessMessage } from './ContactSuccessMessage';
import { StatusCard } from '@/shared/components/ui/StatusCard';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { SubmitButton } from './SubmitButton';
import { TurnstileWidget } from './TurnstileWidget';
import { useServiceStatus } from './ServiceStatusManager';
import { useFormSubmission } from './FormSubmissionHandler';
import { useTurnstileManager } from './TurnstileManager';

interface ContactFormInnerProps {
  className?: string;
}

export function ContactFormInner({ className }: ContactFormInnerProps) {
  // Service status and CSRF token management
  const { serviceStatus, csrfToken, isLoading: servicesLoading, error: servicesError } = useServiceStatus();

  // Form submission state and actions
  const { isSubmitting, submitStatus, errorMessage, submitForm, resetSubmissionState, setSubmissionError } =
    useFormSubmission();

  // Turnstile token management
  const { turnstileToken, handleTurnstileVerify, handleTurnstileExpire, resetTurnstileToken, clearVerificationError } =
    useTurnstileManager();

  // React Hook Form setup
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

  // Enhanced Turnstile verification handler that clears related errors
  const handleEnhancedTurnstileVerify = (token: string) => {
    handleTurnstileVerify(token);
    clearVerificationError(errorMessage, resetSubmissionState);
  };

  const onSubmit = async (data: ContactFormData) => {
    if (!turnstileToken || !csrfToken) {
      const message = !turnstileToken
        ? 'Please complete the security verification'
        : 'A security token is required to send a message';
      setSubmissionError(message);
      return;
    }

    try {
      await submitForm(data, turnstileToken, csrfToken);
      if (submitStatus !== 'error') {
        reset();
        resetTurnstileToken();
      }
    } catch {
      // Error handling is done in submitForm
    }
  };

  const handleSendAnother = () => {
    resetSubmissionState();
  };

  // Handle service loading errors
  if (servicesError) {
    return (
      <div className={className}>
        <StatusCard variant="error" message={servicesError} showIcon data-testid="services-error" />
      </div>
    );
  }

  // Show loading state while services are being fetched
  if (servicesLoading) {
    return (
      <div className={className}>
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

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
      {serviceStatus?.services.turnstile.enabled && serviceStatus.services.turnstile.siteKey && (
        <TurnstileWidget
          siteKey={serviceStatus.services.turnstile.siteKey}
          onVerify={handleEnhancedTurnstileVerify}
          onExpire={handleTurnstileExpire}
          className="my-6"
        />
      )}

      <SubmitButton
        isSubmitting={isSubmitting}
        disabled={(!turnstileToken && serviceStatus?.services.turnstile.enabled) || !csrfToken || !serviceStatus}
        data-testid="submit-button"
      />
    </form>
  );
}

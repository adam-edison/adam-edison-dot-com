import React, { useState, useEffect } from 'react';
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

interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'error';
  services: {
    email: {
      enabled: boolean;
      ready: boolean;
    };
    turnstile: {
      enabled: boolean;
      ready: boolean;
      siteKey?: string;
    };
  };
}

interface ContactFormInnerProps {
  className?: string;
}

export function ContactFormInner({ className }: ContactFormInnerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);

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

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        // Fetch both CSRF token and service status concurrently
        const [csrfResponse, serviceResponse] = await Promise.all([
          fetch('/api/csrf-token'),
          fetch('/api/email-service-check')
        ]);

        if (!csrfResponse.ok) {
          throw new Error('Failed to fetch security token');
        }
        if (!serviceResponse.ok) {
          throw new Error('Failed to fetch service status');
        }

        const [csrfData, serviceData] = await Promise.all([csrfResponse.json(), serviceResponse.json()]);

        setCsrfToken(csrfData.token);
        setServiceStatus(serviceData);
      } catch (error) {
        handleUnexpectedError(error);
      }
    };

    fetchServiceData();
  }, []);

  const submitContactForm = async (data: ContactFormData): Promise<Response> => {
    if (!turnstileToken) {
      throw new Error('Please complete the security verification');
    }

    if (!csrfToken) {
      throw new Error('A security token is required to send a message');
    }

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

  const onSubmit = async (data: ContactFormData) => {
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
      // Reset Turnstile widget - This is a limitation now.
      // A full reset would require a page reload.
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
      {serviceStatus?.services.turnstile.enabled && serviceStatus.services.turnstile.siteKey && (
        <TurnstileWidget
          siteKey={serviceStatus.services.turnstile.siteKey}
          onVerify={handleTurnstileVerify}
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

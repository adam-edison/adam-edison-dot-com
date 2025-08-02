import React, { useEffect, useState, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactFormValidator, ContactFormData } from '@/features/contact/ContactFormValidator';
import { ContactSuccessMessage } from './ContactSuccessMessage';
import { StatusCard } from '@/shared/components/ui/StatusCard';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { SubmitButton } from './SubmitButton';
import { ContactFormService, ContactFormState } from '../ContactFormService';
import { logger } from '@/shared/Logger';

interface ContactFormInnerProps {
  className?: string;
  contactService: ContactFormService;
}

export function ContactFormInner({ className, contactService }: ContactFormInnerProps) {
  const [serviceState, setServiceState] = useState<ContactFormState>(contactService.getState());
  const turnstileContainerRef = useRef<HTMLDivElement>(null);

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

  // Initialize service and subscribe to state changes
  useEffect(() => {
    contactService.onStateChange(setServiceState);
    contactService.initialize();

    return () => {
      contactService.cleanup();
    };
  }, [contactService]);

  // Initialize Turnstile when service is ready
  useEffect(() => {
    if (
      serviceState.serviceStatus?.services.turnstile.enabled &&
      turnstileContainerRef.current &&
      !serviceState.isLoading
    ) {
      contactService.initializeTurnstile(turnstileContainerRef.current);
    }
  }, [serviceState.serviceStatus, serviceState.isLoading, contactService]);

  const onSubmit = async (data: ContactFormData) => {
    const result = await contactService.submitForm(data);

    if (!result.success) {
      logger.error('Failed to submit contact form:', result.error);
      return;
    }

    reset();
  };

  // Handle service loading errors
  if (serviceState.errorMessage && !serviceState.isLoading && !serviceState.serviceStatus) {
    return (
      <div className={className}>
        <StatusCard variant="error" message={serviceState.errorMessage} showIcon />
      </div>
    );
  }

  // Show loading state while services are being fetched
  if (serviceState.isLoading) {
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

  if (serviceState.submitStatus === 'success') {
    return <ContactSuccessMessage className={className} />;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${className} space-y-6`}>
      {serviceState.submitStatus === 'error' && serviceState.errorMessage && (
        <StatusCard variant="error" message={serviceState.errorMessage} showIcon />
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
      {serviceState.serviceStatus?.services.turnstile.enabled &&
        serviceState.serviceStatus.services.turnstile.siteKey && (
          <div className="my-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">Security Verification *</label>
              <div ref={turnstileContainerRef} className="turnstile-container" data-testid="turnstile-widget" />
              <div className="text-xs text-gray-400 mt-2">
                <p>This verification helps protect against spam while respecting your privacy.</p>
              </div>
            </div>
          </div>
        )}

      <SubmitButton
        isSubmitting={serviceState.isSubmitting}
        disabled={serviceState.isLoading || !serviceState.serviceStatus}
        data-testid="submit-button"
      />
    </form>
  );
}

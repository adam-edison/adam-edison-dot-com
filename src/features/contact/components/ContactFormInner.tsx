import React, { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ContactFormValidator, ContactFormData } from '@/features/contact/ContactFormValidator';
import { AntiBotService, type AntiBotData } from '@/features/contact/AntiBotService';
import { ContactSuccessMessage } from './ContactSuccessMessage';
import { StatusCard } from '@/shared/components/ui/StatusCard';
import { InputField } from './InputField';
import { TextareaField } from './TextareaField';
import { SubmitButton } from './SubmitButton';
import { logger } from '@/shared/Logger';

interface ContactFormInnerProps {
  className?: string;
}

export function ContactFormInner({ className }: ContactFormInnerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formData, setFormData] = useState<AntiBotData>(() => AntiBotService.create().createFormInitialData());

  const antiBotService = AntiBotService.create();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue
  } = useForm<ContactFormData>({
    resolver: zodResolver(ContactFormValidator.schema),
    mode: 'onChange'
  });

  const watchedMessage = useWatch({ control, name: 'message' });

  // Register anti-bot fields with react-hook-form
  useEffect(() => {
    setValue('subject', formData.subject);
    setValue('phone', formData.phone);
    setValue('mathAnswer', formData.mathAnswer);
    setValue('formLoadTime', formData.formLoadTime);
    setValue('mathNum1', formData.mathNum1);
    setValue('mathNum2', formData.mathNum2);
  }, [setValue, formData]);

  const generateNewMathChallenge = () => {
    const challenge = antiBotService.generateMathChallenge();
    setFormData((prev) => ({
      ...prev,
      mathNum1: challenge.num1,
      mathNum2: challenge.num2,
      mathAnswer: ''
    }));
    setValue('mathAnswer', '');
  };

  const validateAntiBotFields = (contactFormData: ContactFormData): boolean => {
    const validationData: AntiBotData = {
      subject: contactFormData.subject || '',
      phone: contactFormData.phone || '',
      formLoadTime: contactFormData.formLoadTime || formData.formLoadTime,
      mathAnswer: contactFormData.mathAnswer || '',
      mathNum1: contactFormData.mathNum1 || formData.mathNum1,
      mathNum2: contactFormData.mathNum2 || formData.mathNum2
    };

    const result = antiBotService.validateAntiBotData(validationData);

    if (!result.success) {
      setSubmitStatus('error');

      if (result.error.message === 'Incorrect math answer') {
        setErrorMessage('Incorrect answer to the security question. Please try again.');
        generateNewMathChallenge();
        return false;
      } else if (result.error.message === 'Form submitted too quickly') {
        setErrorMessage('Please wait a moment before submitting the form.');
        return false;
      } else if (result.error.message === 'Backup field detected') {
        setErrorMessage('Security verification failed. Please try again.');
        return false;
      } else {
        setErrorMessage('Security verification failed. Please try again.');
        return false;
      }
    }

    return true;
  };

  const submitContactForm = async (data: ContactFormData): Promise<Response> => {
    const submissionData = {
      ...data,
      antiBotData: {
        subject: data.subject || '',
        phone: data.phone || '',
        formLoadTime: formData.formLoadTime,
        mathAnswer: data.mathAnswer || '',
        mathNum1: formData.mathNum1,
        mathNum2: formData.mathNum2
      }
    };

    return fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(submissionData)
    });
  };

  const handleApiError = async (response: Response): Promise<void> => {
    const errorData = await response.json();
    setSubmitStatus('error');

    let friendlyMessage = errorData.message || 'Failed to send message';
    if (friendlyMessage.includes('Incorrect math answer')) {
      friendlyMessage = 'Incorrect answer to the security question. Please try again.';
      generateNewMathChallenge();
    } else if (friendlyMessage.includes('security') || friendlyMessage.includes('verification')) {
      friendlyMessage = 'Security verification failed. Please try again.';
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

    // Validate anti-bot fields first (client-side)
    if (!validateAntiBotFields(data)) {
      setIsSubmitting(false);
      return;
    }

    // Only reset status/error if validation passed
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
      // Generate new anti-bot data for next form
      setFormData(antiBotService.createFormInitialData());
    } catch (error) {
      handleUnexpectedError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendAnother = () => {
    setSubmitStatus('idle');
    setErrorMessage('');
    setFormData(antiBotService.createFormInitialData());
  };

  if (submitStatus === 'success') {
    return <ContactSuccessMessage className={className} onSendAnother={handleSendAnother} />;
  }

  const mathQuestion = `What is ${formData.mathNum1} + ${formData.mathNum2}?`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`${className} space-y-6`}>
      {submitStatus === 'error' && errorMessage && (
        <StatusCard variant="error" message={errorMessage} showIcon data-testid="error-message" />
      )}

      {/* Backup contact fields */}
      <input
        {...register('subject')}
        type="email"
        data-testid="subject"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
        value={formData.subject}
        onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
      />
      <input
        {...register('phone')}
        type="tel"
        data-testid="phone"
        style={{ display: 'none' }}
        tabIndex={-1}
        autoComplete="off"
        value={formData.phone}
        onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
      />

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

      {/* Math challenge for human verification */}
      <div className="space-y-2">
        <label htmlFor="mathAnswer" className="block text-sm font-medium text-gray-200">
          Security Question: <span data-testid="math-question">{mathQuestion}</span>
        </label>
        <input
          {...register('mathAnswer', {
            required: 'Please answer the security question',
            valueAsNumber: false // Keep as string for validation
          })}
          type="number"
          id="mathAnswer"
          data-testid="math-answer"
          placeholder="Enter your answer"
          className="w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={formData.mathAnswer}
          onChange={(e) => setFormData((prev) => ({ ...prev, mathAnswer: e.target.value }))}
        />
        {errors.mathAnswer && <p className="text-sm text-red-400">{errors.mathAnswer.message}</p>}
      </div>

      <div className="text-sm text-gray-400">
        <p>This form is protected by anti-bot measures to prevent spam.</p>
      </div>

      <SubmitButton isSubmitting={isSubmitting} data-testid="submit-button" />
    </form>
  );
}
